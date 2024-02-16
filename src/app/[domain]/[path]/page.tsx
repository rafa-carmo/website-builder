import FunnelEditor from "@/app/(main)/subaccount/[subaccountId]/funnels/[funnelId]/editor/[funnelPageId]/_components/funnel-editor"
import { getDomainContent } from "@/lib/queries"
import EditorProvider from "@/providers/editor/editor-provider"
import { notFound } from "next/navigation"

interface PathPageProps {
	params: {
		domain: string
		path: string
	}
}

export default async function Page({ params }: PathPageProps) {
	const domainData = await getDomainContent(
		params.domain.split(".").slice(0, -1)[0],
	)
	const pageData = domainData?.FunnelPages.find(
		(page) => page.pathName === params.path,
	)
	if (!pageData || !domainData) return notFound()

	return (
		<EditorProvider
			subaccountId={domainData.subAccountId}
			pageDetails={pageData}
			funnelId={domainData.id}
		>
			<FunnelEditor funnelPageId={pageData.id} liveMode />
		</EditorProvider>
	)
}
