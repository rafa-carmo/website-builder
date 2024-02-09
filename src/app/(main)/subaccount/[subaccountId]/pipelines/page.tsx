import { createPipeline, getPipelineIfExists } from "@/lib/queries"
import { redirect } from "next/navigation"

interface PipelinesPageProps {
	params: {
		subaccountId: string
	}
}

export default async function PipeliensPage({ params }: PipelinesPageProps) {
	const pipelineExists = await getPipelineIfExists(params.subaccountId)

	if (pipelineExists) {
		return redirect(
			`/subaccount/${params.subaccountId}/pipelines/${pipelineExists.id}`,
		)
	}

	try {
		const response = await createPipeline(params.subaccountId)
		return redirect(
			`/subaccount/${params.subaccountId}/pipelines/${response.id}`,
		)
	} catch (error) {
		console.error(error)
	}
	return <></>
}
