"use client"

import { SubAccountDetails } from "@/components/forms/subaccount-details"
import { CustomModal } from "@/components/global/custom-modal"
import { Button } from "@/components/ui/button"
import { useModal } from "@/providers/modal-provider"
import { Agency, AgencySidebarOption, SubAccount, User } from "@prisma/client"
import { PlusCircleIcon } from "lucide-react"
import { twMerge } from "tailwind-merge"

interface CreateSubaccountButtonProps {
	user: User & {
		Agency:
			| (
					| Agency
					| (null & {
							SubAccount: SubAccount[]
							SideBarOption: AgencySidebarOption[]
					  })
			  )
			| null
	}
	id: string
	className?: string
}

export function CreateSubaccountButton({
	id,
	user,
	className,
}: CreateSubaccountButtonProps) {
	const { setOpen } = useModal()

	const agencyDetails = user.Agency
	if (!agencyDetails) return

	return (
		<Button
			className={twMerge("w-full flex gap-4", className)}
			onClick={() => {
				setOpen(
					<CustomModal
						title="Create Subaccount"
						subheading="Create a new subaccount for your agency"
					>
						<SubAccountDetails
							agencyDetails={agencyDetails}
							userId={user.id}
							userName={user.name}
						/>
					</CustomModal>,
				)
			}}
		>
			<PlusCircleIcon size={15} /> Create Sub Account
		</Button>
	)
}
