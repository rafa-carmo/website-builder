"use server"

import { access } from "fs"
import { clerkClient, currentUser } from "@clerk/nextjs"
import { Agency, Plan, SubAccount, User } from "@prisma/client"
import { redirect } from "next/navigation"
import { v4 } from "uuid"
import { db } from "./db"

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

	const response = await db.subAccount.findUnique({
		where: { id: subaccountId },
	})

	if (response) foundAgencyId = response.agencyId

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
