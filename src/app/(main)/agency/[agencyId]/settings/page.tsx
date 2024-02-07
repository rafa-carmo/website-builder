import { AgencyDetails } from "@/components/forms/agency-details"
import { UserDetails } from "@/components/forms/user-details"
import { getAgencyDetails, getUserDetails } from "@/lib/queries"
import { currentUser } from "@clerk/nextjs"

interface SettingsPageProps {
	params: { agencyId: string }
}

export default async function SettingsPage({ params }: SettingsPageProps) {
	const authUser = await currentUser()
	if (!authUser) return null

	const userDetails = await getUserDetails(
		authUser.emailAddresses[0].emailAddress,
	)

	if (!userDetails) return null

	const agencyDetails = await getAgencyDetails(params.agencyId)
	if (!agencyDetails) return null

	const subAccounts = agencyDetails.SubAccount

	return (
		<div className="flex lg:flex-row flex-col gap-4">
			<AgencyDetails data={agencyDetails} />
			<UserDetails
				type="agency"
				id={params.agencyId}
				subAccounts={subAccounts}
				userData={userDetails}
			/>
		</div>
	)
}
