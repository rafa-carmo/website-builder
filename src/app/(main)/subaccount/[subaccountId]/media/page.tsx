import { BlurPage } from "@/components/global/blur-page"
import { MediaComponent } from "@/components/media"
import { getMedia } from "@/lib/queries"

interface MediaPageProps {
	params: {
		subaccountId: string
	}
}

export default async function MediaPage({ params }: MediaPageProps) {
	const data = await getMedia(params.subaccountId)
	return (
		<BlurPage>
			<MediaComponent data={data} subaccountId={params.subaccountId} />
		</BlurPage>
	)
}
