import { getFunnel } from "@/lib/queries"
import { redirect } from "next/navigation"

interface FunnelPageProps {
	params: {
		subaccountId: string
		funnelId: string
	}
}

export async function FunnelPage({ params }: FunnelPageProps) {
	const funnelPages = await getFunnel(params.funnelId)
	if (!funnelPages)
		return redirect(`/subaccount/${params.subaccountId}/funnels`)
	return <></>
}
