import { getAuthUserDetails } from "@/lib/queries"
import MenuOptions from "./menu-options"

interface SidebarProps {
	id: string
	type: "agency" | "subaccount"
}

export async function Sidebar({ id, type }: SidebarProps) {
	const user = await getAuthUserDetails()
	if (!user) return null
	if (!user.Agency) return null

	const details =
		type === "agency"
			? user.Agency
			: user.Agency.SubAccount.find((subaccount) => subaccount.id === id)

	const isWhiteLabeledAgency = user.Agency.whiteLabel
	if (!details) return

	let sideBarLogo = user.Agency.agencyLogo || "/assets/plura-logo.svg"

	if (!isWhiteLabeledAgency) {
		if (type === "subaccount") {
			sideBarLogo =
				user.Agency.SubAccount.find((subaccount) => subaccount.id === id)
					?.subAccountLogo || user.Agency.agencyLogo
		}
	}

	const sidebarOptions =
		type === "agency"
			? user.Agency.SidebarOption || []
			: user.Agency.SubAccount.find((subaccount) => subaccount.id === id)
					?.SidebarOption || []

	const subaccounts = user.Agency.SubAccount.filter((subaccount) =>
		user.Permissions.find(
			(permission) =>
				permission.subAccountId === subaccount.id && permission.access,
		),
	)

	return (
		<>
			<MenuOptions
				defaultOpen={true}
				id={id}
				details={details}
				sidebarLogo={sideBarLogo}
				sidebarOptions={sidebarOptions}
				subAccounts={subaccounts}
				user={user}
			/>
			<MenuOptions
				id={id}
				details={details}
				sidebarLogo={sideBarLogo}
				sidebarOptions={sidebarOptions}
				subAccounts={subaccounts}
				user={user}
			/>
		</>
	)
}
