import { SendInvitation } from "@/components/forms/send-invitation"
import { getAgencyDetails, getTeamUsers } from "@/lib/queries"
import { currentUser } from "@clerk/nextjs"
import { PlusIcon } from "lucide-react"
import { columns } from "./columns"
import { DataTable } from "./data-table"

interface TeamPageProps {
	params: {
		agencyId: string
	}
}

export default async function TeamPage({ params }: TeamPageProps) {
	const authUser = await currentUser()
	if (!authUser) return null

	const teamMembers = await getTeamUsers(params.agencyId)
	if (!teamMembers) return null

	const agencyDetails = await getAgencyDetails(params.agencyId)
	if (!agencyDetails) return null

	return (
		<DataTable
			actionButtonText={
				<>
					<PlusIcon size={15} /> Add
				</>
			}
			modalChildren={<SendInvitation agencyId={agencyDetails.id} />}
			filterValue="name"
			columns={columns}
			data={teamMembers}
		/>
	)
}
