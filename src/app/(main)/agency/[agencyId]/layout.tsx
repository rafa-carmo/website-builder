import { BlurPage } from "@/components/global/blur-page"
import { InfoBar } from "@/components/global/info-bar"
import { Sidebar } from "@/components/sidebar"
import { Unauthorized } from "@/components/unauthorized"
import {
	getNotificationAndUser,
	verifyAndAcceptInvitation,
} from "@/lib/queries"
import { currentUser } from "@clerk/nextjs"
import { redirect } from "next/navigation"

interface LayoutProps {
	children: React.ReactNode
	params: {
		agencyId: string
	}
}

export default async function Layout({ children, params }: LayoutProps) {
	const agencyId = await verifyAndAcceptInvitation()
	const user = await currentUser()

	if (!user) {
		return redirect("/")
	}

	if (!agencyId) {
		return redirect("/agency")
	}

	if (
		user.privateMetadata.role !== "AGENCY_OWNER" &&
		user.privateMetadata.role !== "AGENCY_ADMIN"
	)
		return <Unauthorized />

	const allNotifications = await getNotificationAndUser(agencyId)

	return (
		<div className="h-screen overflow-hidden">
			<Sidebar id={params.agencyId} type="agency" />
			<div className="md:pl-[300px]">
				<InfoBar notifications={allNotifications || []} />
				<div className="relative">
					<BlurPage>{children}</BlurPage>
				</div>
			</div>
		</div>
	)
}
