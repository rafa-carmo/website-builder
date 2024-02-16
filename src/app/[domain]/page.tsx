import { getDomainContent, incrementVisitantPage } from "@/lib/queries"
import EditorProvider from "@/providers/editor/editor-provider"
import { notFound } from "next/navigation"
import FunnelEditor from "../(main)/subaccount/[subaccountId]/funnels/[funnelId]/editor/[funnelPageId]/_components/funnel-editor"

interface DomainPageProps {
	params: {
		domain: string
	}
}

export default async function Page({ params }: DomainPageProps) {
	const domainData = await getDomainContent(
		params.domain.split(".").slice(0, -1)[0],
	)
	if (!domainData) return notFound()

	const pageData = domainData.FunnelPages.find((page) => !page.pathName)

	if (!pageData) return notFound()

	incrementVisitantPage(pageData.id)

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
