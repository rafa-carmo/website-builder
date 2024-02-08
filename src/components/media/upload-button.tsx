"use client"

import { useModal } from "@/providers/modal-provider"
import { UploadMediaForm } from "../forms/upload-media"
import { CustomModal } from "../global/custom-modal"
import { Button } from "../ui/button"

interface MediaUploadButtonProps {
	subaccountId: string
}

export function MediaUploadButton({ subaccountId }: MediaUploadButtonProps) {
	const { setOpen } = useModal()

	return (
		<Button
			onClick={() => {
				setOpen(
					<CustomModal
						title="Upload Media"
						subheading="Upload a file to your media bucket"
					>
						<UploadMediaForm subaccountId={subaccountId} />
					</CustomModal>,
				)
			}}
		>
			Upload
		</Button>
	)
}
