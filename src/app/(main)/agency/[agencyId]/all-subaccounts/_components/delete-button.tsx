"use client"
import {
	deleteSubaccount,
	getSubaccountDetails,
	saveActivityLogsNotification,
} from "@/lib/queries"
import { useRouter } from "next/navigation"

interface DeleteButtonProps {
	subaccountId: string
}

export function DeleteButton({ subaccountId }: DeleteButtonProps) {
	const router = useRouter()

	const handleClick = async () => {
		const response = await getSubaccountDetails(subaccountId)
		await saveActivityLogsNotification({
			agencyId: undefined,
			description: `Deleted a subaccount | ${response?.name}`,
			subaccountId,
		})
		await deleteSubaccount(subaccountId)
		router.refresh()
	}

	return <div onClick={handleClick}>Delete</div>
}
