import { InfoBar } from "@/components/global/info-bar"
import { Sidebar } from "@/components/sidebar"
import { Unauthorized } from "@/components/unauthorized"
import {
	getAuthUserDetails,
	getNotificationAndUser,
	verifyAndAcceptInvitation,
} from "@/lib/queries"
import { NotificationWithUser } from "@/lib/types"
import { currentUser } from "@clerk/nextjs"
import { Role } from "@prisma/client"
import { redirect } from "next/navigation"

interface SubAccountPageProps {
	children: React.ReactNode
	params: {
		subaccountId: string
	}
}

export default async function SubAccountLayout({
	children,
	params,
}: SubAccountPageProps) {
	const agencyId = await verifyAndAcceptInvitation()
	if (!agencyId) return <Unauthorized />

	const user = await currentUser()
	if (!user) return redirect("/")

	let notifications: NotificationWithUser | [] = []

	if (!user.privateMetadata.role) {
		return <Unauthorized />
	}

	const allPermissions = await getAuthUserDetails()
	const hasPermission = allPermissions?.Permissions.find(
		(permissions) =>
			permissions.access && permissions.subAccountId === params.subaccountId,
	)
	if (!hasPermission) {
		return <Unauthorized />
	}

	const allNotifications = await getNotificationAndUser(agencyId)

	if (
		user.privateMetadata.role === "AGENCY_ADMIN" ||
		user.privateMetadata.role === "AGENCY_OWNER"
	) {
		notifications = allNotifications || []
	} else {
		const filteredNoti = allNotifications?.filter(
			(item) => item.subAccountId === params.subaccountId,
		)
		if (filteredNoti) notifications = filteredNoti
	}

	return (
		<div className="h-screen overflow-hidden">
			<Sidebar id={params.subaccountId} type="subaccount" />

			<div className="md:pl-[300px]">
				<InfoBar
					notifications={notifications}
					role={user.privateMetadata.role as Role}
					subaccountId={params.subaccountId as string}
				/>
				<div className="relative">{children}</div>
			</div>
		</div>
	)
}
