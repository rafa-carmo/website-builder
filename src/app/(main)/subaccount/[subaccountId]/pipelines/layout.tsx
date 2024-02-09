import { BlurPage } from "@/components/global/blur-page"

interface PipelineLayoutProps {
	children: React.ReactNode
}

export default function PipelineLayout({ children }: PipelineLayoutProps) {
	return <BlurPage>{children}</BlurPage>
}
