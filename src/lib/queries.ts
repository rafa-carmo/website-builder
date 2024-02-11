"use server"

import { clerkClient, currentUser } from "@clerk/nextjs"
import {
	Agency,
	Lane,
	Plan,
	Prisma,
	Role,
	SubAccount,
	Tag,
	Ticket,
	User,
} from "@prisma/client"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { v4 } from "uuid"
import { z } from "zod"
import { db } from "./db"
import {
	CreateFunnelFormSchema,
	CreateMediaType,
	UpsertFunnelPage,
} from "./types"

export async function getAuthUserDetails() {
	const user = await currentUser()
	if (!user) {
		return
	}

	const userData = await db.user.findUnique({
		where: { email: user.emailAddresses[0].emailAddress },
		include: {
			Agency: {
				include: {
					SidebarOption: true,
					SubAccount: {
						include: {
							SidebarOption: true,
						},
					},
				},
			},
			Permissions: true,
		},
	})

	return userData
}

export async function saveActivityLogsNotification({
	agencyId,
	description,
	subaccountId,
}: { agencyId?: string; description: string; subaccountId?: string }) {
	const authUser = await currentUser()
	let userData: User | null | undefined

	if (!authUser) {
		const response = await db.user.findFirst({
			where: {
				Agency: { SubAccount: { some: { id: subaccountId } } },
			},
		})
		if (response) {
			userData = response
		}
	} else {
		userData = await db.user.findUnique({
			where: { email: authUser.emailAddresses[0].emailAddress },
		})
	}

	if (!userData) {
		console.log("could not find a user")
		return
	}

	let foundAgencyId = agencyId
	if (!foundAgencyId) {
		if (!subaccountId) {
			throw new Error(
				"You need to provide at least an agency id or subaccount ID",
			)
		}
	}
	if (subaccountId) {
		const response = await db.subAccount.findUnique({
			where: { id: subaccountId },
		})

		if (response) foundAgencyId = response.agencyId
	}

	if (subaccountId) {
		await db.notification.create({
			data: {
				notification: `${userData.name} | ${description}`,
				User: {
					connect: {
						id: userData.id,
					},
				},
				Agency: {
					connect: {
						id: foundAgencyId,
					},
				},
				SubAccount: {
					connect: { id: subaccountId },
				},
			},
		})
	} else {
		await db.notification.create({
			data: {
				notification: `${userData.name} | ${description}`,
				User: {
					connect: {
						id: userData.id,
					},
				},
				Agency: {
					connect: {
						id: foundAgencyId,
					},
				},
			},
		})
	}
}

export async function createTeamUser(agencyId: string, user: User) {
	if (user.role === "AGENCY_OWNER") return null

	const response = await db.user.create({ data: { ...user } })
	return response
}

export async function verifyAndAcceptInvitation() {
	const user = await currentUser()
	if (!user) redirect("/sign-in")
	const invitationExists = await db.invitation.findUnique({
		where: { email: user?.emailAddresses[0].emailAddress, status: "PENDING" },
	})

	if (invitationExists) {
		const userDetails = await createTeamUser(invitationExists.agencyId, {
			email: invitationExists.email,
			agencyId: invitationExists.agencyId,
			avatarUrl: user.imageUrl,
			id: user.id,
			name: `${user.firstName} ${user.lastName}`,
			role: invitationExists.role,
			createdAt: new Date(),
			updatedAt: new Date(),
		})

		await saveActivityLogsNotification({
			agencyId: invitationExists.agencyId,
			description: "Joined",
			subaccountId: undefined,
		})

		if (userDetails) {
			await clerkClient.users.updateUserMetadata(user.id, {
				privateMetadata: {
					role: userDetails.role || "SUBACCOUNT_USER",
				},
			})
			await db.invitation.delete({
				where: { email: userDetails.email },
			})
			return userDetails?.agencyId
		}
		return null
	}

	const agency = await db.user.findUnique({
		where: {
			email: user.emailAddresses[0].emailAddress,
		},
	})

	return agency ? agency.agencyId : null
}

export async function updateAgencyDetails(
	agencyId: string,
	agencyDetails: Partial<Agency>,
) {
	const response = await db.agency.update({
		data: {
			...agencyDetails,
		},
		where: {
			id: agencyId,
		},
	})

	return response
}

export async function deleteAgency(agencyId: string) {
	const response = await db.agency.delete({
		where: {
			id: agencyId,
		},
	})
	return response
}

export async function initUser(newUser: Partial<User>) {
	const user = await currentUser()
	if (!user) return

	const userData = await db.user.upsert({
		where: {
			email: user.emailAddresses[0].emailAddress,
		},
		update: newUser,
		create: {
			id: user.id,
			avatarUrl: user.imageUrl,
			email: user.emailAddresses[0].emailAddress,
			name: `${user.firstName} ${user.lastName}`,
			role: newUser.role || "SUBACCOUNT_USER",
		},
	})

	await clerkClient.users.updateUserMetadata(user.id, {
		privateMetadata: {
			role: newUser.role || "SUBACCOUNT_USER",
		},
	})

	return userData
}

export async function upsertAgency(agency: Agency, price?: Plan) {
	if (!agency.companyEmail) return null
	try {
		const agencyDetails = await db.agency.upsert({
			where: {
				id: agency.id,
			},
			update: agency,
			create: {
				users: {
					connect: { email: agency.companyEmail },
				},
				...agency,
				SidebarOption: {
					create: [
						{
							name: "Dashboard",
							icon: "category",
							link: `/agency/${agency.id}`,
						},
						{
							name: "Launchpad",
							icon: "clipboardIcon",
							link: `/agency/${agency.id}/launchpad`,
						},
						{
							name: "Billing",
							icon: "payment",
							link: `/agency/${agency.id}/billing`,
						},
						{
							name: "Settings",
							icon: "settings",
							link: `/agency/${agency.id}/settings`,
						},
						{
							name: "Sub Accounts",
							icon: "person",
							link: `/agency/${agency.id}/all-subaccounts`,
						},
						{
							name: "Team",
							icon: "shield",
							link: `/agency/${agency.id}/team`,
						},
					],
				},
			},
		})
		return agencyDetails
	} catch (error) {
		console.error(error)
	}
}

export async function getNotificationAndUser(agencyId: string) {
	try {
		const response = await db.notification.findMany({
			where: { agencyId },
			include: { User: true },
			orderBy: {
				createdAt: "desc",
			},
		})
		return response
	} catch (error) {
		console.error(error)
		return null
	}
}

export async function upsertSubAccount(subAccount: SubAccount) {
	if (!subAccount.companyEmail) return null
	const agencyOwner = await db.user.findFirst({
		where: {
			Agency: {
				id: subAccount.agencyId,
			},
			role: "AGENCY_OWNER",
		},
	})
	if (!agencyOwner) return console.log("🔴Erorr could not create subaccount")
	const permissionId = v4()
	const response = await db.subAccount.upsert({
		where: { id: subAccount.id },
		update: subAccount,
		create: {
			...subAccount,
			Permissions: {
				create: {
					access: true,
					email: agencyOwner.email,
					id: permissionId,
				},
				connect: {
					subAccountId: subAccount.id,
					id: permissionId,
				},
			},
			Pipeline: {
				create: { name: "Lead Cycle" },
			},
			SidebarOption: {
				create: [
					{
						name: "Launchpad",
						icon: "clipboardIcon",
						link: `/subaccount/${subAccount.id}/launchpad`,
					},
					{
						name: "Settings",
						icon: "settings",
						link: `/subaccount/${subAccount.id}/settings`,
					},
					{
						name: "Funnels",
						icon: "pipelines",
						link: `/subaccount/${subAccount.id}/funnels`,
					},
					{
						name: "Media",
						icon: "database",
						link: `/subaccount/${subAccount.id}/media`,
					},
					{
						name: "Automations",
						icon: "chip",
						link: `/subaccount/${subAccount.id}/automations`,
					},
					{
						name: "Pipelines",
						icon: "flag",
						link: `/subaccount/${subAccount.id}/pipelines`,
					},
					{
						name: "Contacts",
						icon: "person",
						link: `/subaccount/${subAccount.id}/contacts`,
					},
					{
						name: "Dashboard",
						icon: "category",
						link: `/subaccount/${subAccount.id}`,
					},
				],
			},
		},
	})
	return response
}

export async function getUserDetails(userEmail: string) {
	return await db.user.findUnique({
		where: {
			email: userEmail,
		},
	})
}

export async function getAgencyDetails(agencyId: string) {
	return await db.agency.findUnique({
		where: {
			id: agencyId,
		},
		include: {
			SubAccount: true,
		},
	})
}

export async function getUserPermissions(userId: string) {
	const response = await db.user.findUnique({
		where: { id: userId },
		select: { Permissions: { include: { SubAccount: true } } },
	})

	return response
}

export async function updateUser(user: Partial<User>) {
	const response = await db.user.update({
		where: { email: user.email },
		data: { ...user },
	})

	await clerkClient.users.updateUserMetadata(response.id, {
		privateMetadata: {
			role: user.role || "SUBACCOUNT_USER",
		},
	})

	return response
}

export async function changeUserPermissions(
	permissionId: string | undefined,
	userEmail: string,
	subAccountId: string,
	permission: boolean,
) {
	try {
		const response = await db.permissions.upsert({
			where: { id: permissionId },
			update: { access: permission },
			create: {
				access: permission,
				email: userEmail,
				subAccountId: subAccountId,
			},
		})
		return response
	} catch (error) {
		console.log("🔴Could not change persmission", error)
	}
}

export async function getSubaccountDetails(subaccountId: string) {
	const response = await db.subAccount.findFirst({
		where: {
			id: subaccountId,
		},
	})

	return response
}

export async function deleteSubaccount(subaccountId: string) {
	const response = await db.subAccount.delete({
		where: {
			id: subaccountId,
		},
	})

	return response
}

export async function getTeamUsers(agencyId: string) {
	const response = await db.user.findMany({
		where: {
			agencyId: agencyId,
		},
		include: {
			Agency: {
				include: {
					SubAccount: true,
				},
			},
			Permissions: {
				include: {
					SubAccount: true,
				},
			},
		},
	})

	return response
}

export async function deleteUser(userId: string) {
	await clerkClient.users.updateUserMetadata(userId, {
		privateMetadata: {
			role: undefined,
		},
	})
	const deletedUser = await db.user.delete({ where: { id: userId } })

	return deletedUser
}

export async function getUser(id: string) {
	const user = await db.user.findUnique({
		where: {
			id,
		},
	})

	return user
}

export async function sendInvitation(
	role: Role,
	email: string,
	agencyId: string,
) {
	const response = await db.invitation.create({
		data: { email, agencyId, role },
	})

	try {
		const invitation = await clerkClient.invitations.createInvitation({
			emailAddress: email,
			redirectUrl: process.env.NEXT_PUBLIC_URL,
			publicMetadata: {
				throughInvitation: true,
				role,
			},
		})
	} catch (error) {
		console.log(error)
		throw error
	}

	return response
}

export async function getMedia(subaccountId: string) {
	const mediaFiles = await db.subAccount.findUnique({
		where: {
			id: subaccountId,
		},
		include: {
			Media: true,
		},
	})

	return mediaFiles
}

export async function createMedia(
	subAccountId: string,
	mediaFile: CreateMediaType,
) {
	const response = await db.media.create({
		data: {
			link: mediaFile.link,
			name: mediaFile.name,
			subAccountId,
		},
	})

	return response
}

export async function deleteMedia(mediaId: string) {
	const response = await db.media.delete({
		where: {
			id: mediaId,
		},
	})

	return response
}

export async function getPipelineIfExists(subAccountId: string) {
	const response = await db.pipeline.findFirst({
		where: { subAccountId },
	})
	return response
}

export async function createPipeline(subAccountId: string) {
	const response = await db.pipeline.create({
		data: { name: "First Pipeline", subAccountId },
	})
	return response
}

export async function getPipelineDetails(pipelineId: string) {
	const response = await db.pipeline.findFirst({
		where: {
			id: pipelineId,
		},
	})

	return response
}

export async function getPipelines(subAccountId: string) {
	const response = db.pipeline.findMany({
		where: {
			subAccountId,
		},
	})

	return response
}

export async function getLanesWithTicketAndTags(pipelineId: string) {
	const response = await db.lane.findMany({
		where: {
			pipelineId,
		},
		orderBy: { order: "asc" },
		include: {
			Tickets: {
				orderBy: {
					order: "asc",
				},
				include: {
					Tags: true,
					Assigned: true,
					Customer: true,
				},
			},
		},
	})
	return response
}

export async function upserFunnel(
	subaccountId: string,
	funnel: z.infer<typeof CreateFunnelFormSchema> & { liveProducts: string },
	funnelId: string,
) {
	const response = await db.funnel.upsert({
		where: { id: funnelId },
		update: funnel,
		create: {
			...funnel,
			id: funnelId || v4(),
			subAccountId: subaccountId,
		},
	})
	return response
}

export async function upsertPipeline(
	pipeline: Prisma.PipelineUncheckedCreateWithoutLaneInput,
) {
	const response = await db.pipeline.upsert({
		where: { id: pipeline.id || v4() },
		update: pipeline,
		create: pipeline,
	})

	return response
}

export async function deletePipeline(pipelineId: string) {
	const response = await db.pipeline.delete({
		where: {
			id: pipelineId,
		},
	})

	return response
}

export async function updateLanesOrder(lanes: Lane[]) {
	try {
		const updateTrans = lanes.map((lane) =>
			db.lane.update({
				where: {
					id: lane.id,
				},
				data: {
					order: lane.order,
				},
			}),
		)
		await db.$transaction(updateTrans)
		console.info("Done Reorder")
	} catch (error) {
		console.error(error, "UPDATE ORDER ERROR")
	}
}

export async function updateTicketsOrder(tickets: Ticket[]) {
	try {
		const updateTrans = tickets.map((ticket) =>
			db.ticket.update({
				where: {
					id: ticket.id,
				},
				data: {
					order: ticket.order,
					laneId: ticket.laneId,
				},
			}),
		)
		await db.$transaction(updateTrans)
		console.info("Done reorder")
	} catch (err) {
		console.error(err, "UPDATE ORDER ERROR")
	}
}

export async function upsertLane(lane: Prisma.LaneUncheckedCreateInput) {
	let order: number

	if (!lane.order) {
		const lanes = await db.lane.findMany({
			where: {
				pipelineId: lane.pipelineId,
			},
		})

		order = lanes.length
	} else {
		order = lane.order
	}

	const response = await db.lane.upsert({
		where: { id: lane.id || v4() },
		update: lane,
		create: { ...lane, order },
	})

	return response
}

export async function deleteLane(laneId: string) {
	const response = await db.lane.delete({
		where: {
			id: laneId,
		},
	})

	return response
}

export async function getTicketsWithTags(pipelineId: string) {
	const response = db.ticket.findMany({
		where: {
			Lane: {
				pipelineId,
			},
		},
		include: {
			Tags: true,
			Assigned: true,
			Customer: true,
		},
	})

	return response
}

export async function _getTicketsWithAllRelations(laneId: string) {
	const response = await db.ticket.findMany({
		where: {
			laneId,
		},
		include: {
			Assigned: true,
			Customer: true,
			Lane: true,
			Tags: true,
		},
	})

	return response
}

export async function getSubAccountTeamMembers(subAccountId: string) {
	const response = db.user.findMany({
		where: {
			Agency: {
				SubAccount: {
					some: {
						id: subAccountId,
					},
				},
			},
			role: "SUBACCOUNT_USER",
			Permissions: {
				some: {
					subAccountId,
					access: true,
				},
			},
		},
	})

	return response
}

export async function searchContacts(searchTerms: string) {
	const response = await db.contact.findMany({
		where: {
			name: {
				contains: searchTerms,
			},
		},
	})
	return response
}

export async function upsertTicket(
	ticket: Prisma.TicketUncheckedCreateInput,
	tags: Tag[],
) {
	let order: number
	if (!ticket.order) {
		const tickets = await db.ticket.findMany({
			where: { laneId: ticket.laneId },
		})
		order = tickets.length
	} else {
		order = ticket.order
	}

	const response = await db.ticket.upsert({
		where: {
			id: ticket.id || v4(),
		},
		update: { ...ticket, Tags: { set: tags } },
		create: { ...ticket, Tags: { connect: tags }, order },
		include: {
			Assigned: true,
			Customer: true,
			Tags: true,
			Lane: true,
		},
	})

	return response
}

export async function deleteTicket(ticketId: string) {
	const response = db.ticket.delete({
		where: {
			id: ticketId,
		},
	})

	return response
}

export async function getAgencySubscription(agencyId: string) {
	const response = await db.agency.findUnique({
		where: {
			id: agencyId,
		},
		select: {
			customerId: true,
			Subscription: true,
		},
	})

	return response
}

export async function getFunnels(subacountId: string) {
	const funnels = await db.funnel.findMany({
		where: { subAccountId: subacountId },
		include: { FunnelPages: true },
	})

	return funnels
}

export async function upsertFunnel(
	subaccountId: string,
	funnel: z.infer<typeof CreateFunnelFormSchema> & { liveProducts: string },
	funnelId: string,
) {
	const response = await db.funnel.upsert({
		where: { id: funnelId },
		update: funnel,
		create: {
			...funnel,
			id: funnelId || v4(),
			subAccountId: subaccountId,
		},
	})

	return response
}

export async function getFunnel(funnelId: string) {
	const response = await db.funnel.findUnique({
		where: { id: funnelId },
		include: {
			FunnelPages: true,
		},
	})

	return response
}

export async function updateFunnelProducts(products: string, funnelId: string) {
	const data = await db.funnel.update({
		where: { id: funnelId },
		data: { liveProducts: products },
	})
	return data
}

export async function upsertFunnelPage(
	subaccountId: string,
	funnelPage: UpsertFunnelPage,
	funnelId: string,
) {
	if (!subaccountId || !funnelId) return
	const response = await db.funnelPage.upsert({
		where: { id: funnelPage.id || "" },
		update: { ...funnelPage },
		create: {
			...funnelPage,
			content: funnelPage.content
				? funnelPage.content
				: JSON.stringify([
						{
							content: [],
							id: "__body",
							name: "Body",
							styles: { backgroundColor: "white" },
							type: "__body",
						},
				  ]),
			funnelId,
		},
	})

	revalidatePath(`/subaccount/${subaccountId}/funnels/${funnelId}`, "page")
	return response
}

export async function deleteFunnelPage(funnelPageId: string) {
	const response = await db.funnelPage.delete({
		where: {
			id: funnelPageId,
		},
	})

	return response
}
