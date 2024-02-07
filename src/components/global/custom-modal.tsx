"use client"

import { useModal } from "@/providers/modal-provider"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "../ui/dialog"

interface CustomModalProps {
	title: string
	subheading: string
	children: React.ReactNode
	defaultOpen?: boolean
}

export function CustomModal({
	title,
	subheading,
	defaultOpen,
	children,
}: CustomModalProps) {
	const { isOpen, setClose } = useModal()
	return (
		<Dialog open={isOpen || defaultOpen} onOpenChange={setClose}>
			<DialogContent className="overflow-scroll md:max-h-[700px] md:h-fit h-screen bg-card">
				<DialogHeader className="pt-8 text-left">
					<DialogTitle className="text-2xl font-bold">{title}</DialogTitle>
					<DialogDescription>{subheading}</DialogDescription>
					{children}
				</DialogHeader>
			</DialogContent>
		</Dialog>
	)
}
