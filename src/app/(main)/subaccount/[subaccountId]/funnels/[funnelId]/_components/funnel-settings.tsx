import { FunnelForm } from "@/components/forms/funnel-form"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import { getSubaccountDetails } from "@/lib/queries"
import { getConnectAccountProducts } from "@/lib/stripe/stripe-actions"
import { Funnel } from "@prisma/client"
import Stripe from "stripe"
import { FunnelProductsTable } from "./funnel-products-table"

interface FunnelSettingsProps {
	subaccountId: string
	defaultData: Funnel
}

export async function FunnelSettings({
	defaultData,
	subaccountId,
}: FunnelSettingsProps) {
	const subaccountDetails = await getSubaccountDetails(subaccountId)

	if (!subaccountDetails) return
	let products: Stripe.Product[] | null
	if (subaccountDetails.connectAccountId) {
		products = await getConnectAccountProducts(
			subaccountDetails.connectAccountId,
		)
	}

	return (
		<div className="flex gap-4 flex-col xl:!flex-row">
			<Card className="flex-1 flex-shrink">
				<CardHeader>
					<CardTitle>Funnel Products</CardTitle>
					<CardDescription>
						Select the products and services you wish to sell on this funnel.
						You can sell one time and recurring products too.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<>
						{/* @ts-ignore */}
						{subaccountDetails.connectAccountId && products ? (
							<FunnelProductsTable
								defaultData={defaultData}
								products={products}
							/>
						) : (
							"Connect your stripe account to sell products."
						)}
					</>
				</CardContent>
			</Card>

			<FunnelForm subAccountId={subaccountId} defaultData={defaultData} />
		</div>
	)
}
