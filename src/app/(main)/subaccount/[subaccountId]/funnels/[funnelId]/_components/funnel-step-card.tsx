import Mail from "@/components/icons/mail"
import { Card, CardContent } from "@/components/ui/card"
import { FunnelPage } from "@prisma/client"
import { ArrowDown } from "lucide-react"
import { Draggable } from "react-beautiful-dnd"
import { createPortal } from "react-dom"

interface FunnelStepCardProps {
	funnelPage: FunnelPage
	index: number
	activePage: boolean
}

export function FunnelStepCard({
	activePage,
	funnelPage,
	index,
}: FunnelStepCardProps) {
	const portal = document.getElementById("blur-page")

	return (
		<Draggable index={index} draggableId={funnelPage.id.toString()}>
			{(provided, snapshot) => {
				if (snapshot.isDragging) {
					const offset = { x: 300 }
					//@ts-ignore
					const x = provided.draggableProps.style?.left - offset.x
					//@ts-ignore
					provided.draggableProps.style = {
						...provided.draggableProps.style,
						left: x,
					}
				}
				const component = (
					<Card
						className="p-0 relative cursor-grab my-2"
						{...provided.draggableProps}
						{...provided.dragHandleProps}
						ref={provided.innerRef}
					>
						<CardContent className="p-0 flex items-center gap-4 flex-row">
							<div className="h-14 w-14 bg-muted flex items-center justify-center">
								<Mail />
								<ArrowDown
									size={18}
									className="absolute -bottom-2 text-primary"
								/>
							</div>
							{funnelPage.name}
						</CardContent>
						{activePage && (
							<div className="w-2 top-2 right-2 h-2 absolute bg-emerald-500 rounded-full" />
						)}
					</Card>
				)
				if (!portal) return component
				if (snapshot.isDragging) {
					return createPortal(component, portal)
				}
				return component
			}}
		</Draggable>
	)
}