import { AgencyDetails } from "@/components/forms/agency-details"
import { getAuthUserDetails, verifyAndAcceptInvitation } from "@/lib/queries"
import { currentUser } from "@clerk/nextjs"
import { Plan } from "@prisma/client"
import { redirect } from "next/navigation"

export default async function Page({
	searchParams,
}: { searchParams: { plan: Plan; state: string; code: string } }) {
	const agencyId = await verifyAndAcceptInvitation()

	const user = await getAuthUserDetails()

	if (agencyId) {
		if (user?.role === "SUBACCOUNT_GUEST" || user?.role === "SUBACCOUNT_USER") {
			return redirect("/subaccount")
		}
		if (user?.role === "AGENCY_OWNER" || user?.role === "AGENCY_ADMIN") {
			if (searchParams.plan) {
				return redirect(`/agency/${agencyId}/billing?=${searchParams.plan}`)
			}
			if (searchParams.state) {
				const statePath = searchParams.state.split("__")[0]
				const stateAgencyId = searchParams.state.split("__")[1]
				if (!stateAgencyId) return <div>Not authorized</div>

				return redirect(
					`agency/${stateAgencyId}/${statePath}?code=${searchParams.code}`,
				)
			}
			return redirect(`/agency/${agencyId}`)
		}
	}
	const authUser = await currentUser()
	return (
		<div className="flex justify-center items-center mt-4">
			<div className="max-w-[850px] bprder-[1px] p-4 rounded-xl">
				<h1 className="text-4xl">Create An Agency</h1>
				<AgencyDetails
					data={{ companyEmail: authUser?.emailAddresses[0].emailAddress }}
				/>
			</div>
		</div>
	)
}
