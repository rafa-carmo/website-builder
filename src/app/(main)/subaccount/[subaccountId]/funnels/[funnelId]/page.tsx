import { BlurPage } from "@/components/global/blur-page"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getFunnel } from "@/lib/queries"
import Link from "next/link"
import { redirect } from "next/navigation"

import { FunnelSettings } from "./_components/funnel-settings"
import { FunnelSteps } from "./_components/funnel-steps"

interface FunnelPageProps {
	params: {
		subaccountId: string
		funnelId: string
	}
}

export default async function FunnelPage({ params }: FunnelPageProps) {
	const funnelPages = await getFunnel(params.funnelId)
	if (!funnelPages)
		return redirect(`/subaccount/${params.subaccountId}/funnels`)

	return (
		<BlurPage>
			<Link
				href={`/subaccount/${params.subaccountId}/funnels`}
				className="flex justify-between text-muted-foreground gap-4 "
			>
				Back
			</Link>
			<h1 className="text-3xl mb-8">{funnelPages.name}</h1>

			<Tabs defaultValue="steps" className="w-full">
				<TabsList className="grid  grid-cols-2 w-full bg-transparent ">
					<TabsTrigger value="steps" className="w-full text-center">
						Steps
					</TabsTrigger>
					<TabsTrigger value="settings" className="w-full text-center">
						Settings
					</TabsTrigger>
				</TabsList>
				<TabsContent value="steps">
					<FunnelSteps
						funnel={funnelPages}
						subaccountId={params.subaccountId}
						pages={funnelPages.FunnelPages}
						funnelId={params.funnelId}
					/>
				</TabsContent>
				<TabsContent value="settings">
					<FunnelSettings
						subaccountId={params.subaccountId}
						defaultData={funnelPages}
					/>
				</TabsContent>
			</Tabs>
		</BlurPage>
	)
}
