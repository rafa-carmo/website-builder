import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
	getLanesWithTicketAndTags,
	getPipelineDetails,
	getPipelines,
	updateLanesOrder,
	updateTicketsOrder,
} from "@/lib/queries"
import { LaneDetail } from "@/lib/types"
import { redirect } from "next/navigation"
import { PipelineView } from "../_components/pipelien-view"
import { PipelineInfoBar } from "../_components/pipeline-infobar"
import { PipelineSettings } from "../_components/pipeline-settings"

interface PipelinePageProps {
	params: {
		pipelineId: string
		subaccountId: string
	}
}

export default async function PipelinePage({ params }: PipelinePageProps) {
	const pipelienDetails = await getPipelineDetails(params.pipelineId)

	if (!pipelienDetails) {
		return redirect(`/subaccount/${params.subaccountId}/pipelines`)
	}

	const pipelines = await getPipelines(params.subaccountId)

	const lanes: LaneDetail[] = await getLanesWithTicketAndTags(params.pipelineId)

	return (
		<Tabs defaultValue="view" className="w-full">
			<TabsList className="bg-transparent border-b-2 h-16 w-full justify-between mb-4">
				<PipelineInfoBar
					pipelineId={params.pipelineId}
					pipelines={pipelines}
					subaccountId={params.subaccountId}
				/>
				<div>
					<TabsTrigger value="view">Pipeline View</TabsTrigger>
					<TabsTrigger value="settings">Settings</TabsTrigger>
				</div>
			</TabsList>
			<TabsContent value="view">
				<PipelineView
					lanes={lanes}
					pipelineDetails={pipelienDetails}
					pipelineId={params.pipelineId}
					subaccountId={params.subaccountId}
					updateLanesOrder={updateLanesOrder}
					updateTicketsOrder={updateTicketsOrder}
				/>
			</TabsContent>
			<TabsContent value="settings">
				<PipelineSettings
					pipelineId={params.pipelineId}
					subaccountId={params.subaccountId}
					pipelines={pipelines}
				/>
			</TabsContent>
		</Tabs>
	)
}
