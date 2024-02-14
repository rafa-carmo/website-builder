import { Separator } from "@/components/ui/separator"
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table"
import { addOnProducts, pricingCards } from "@/lib/constants"
import { getAgencySubscription } from "@/lib/queries"
import { stripe } from "@/lib/stripe"
import clsx from "clsx"
import { PricingCard } from "./_components/pricing-card"

interface BillingPageProps {
	params: {
		agencyId: string
	}
}

export default async function BillingPage({ params }: BillingPageProps) {
	const addOns = await stripe.products.list({
		ids: addOnProducts.map((product) => product.id),
		expand: ["data.default_price"],
	})

	const agencySubscription = await getAgencySubscription(params.agencyId)

	const prices = await stripe.prices.list({
		product: process.env.NEXT_PLURA_PRODUCT_ID,
		active: true,
	})

	const currentPlanDetails = pricingCards.find(
		(current) => current.priceId === agencySubscription?.Subscription?.priceId,
	)

	const charges = await stripe.charges.list({
		limit: 50,
		customer: agencySubscription?.customerId,
	})

	const allCharges = [
		...charges.data.map((charge) => ({
			description: charge.description,
			id: charge.id,
			date: `${new Date(charge.created * 1000).toLocaleDateString()} ${new Date(
				charge.created * 1000,
			).toLocaleDateString()}`,
			status: "Paid",
			amount: `${charge.amount / 100}`,
		})),
	]

	return (
		<>
			<h1 className="text-4xl p-4">Billing</h1>
			<Separator className="mb-6" />
			<h2 className="text-2xl p-4">Current Plan</h2>
			<div className="flex flex-col lg:flex-row justify-between gap-8">
				<PricingCard
					planExists={agencySubscription?.Subscription?.active === true}
					prices={prices.data}
					customerId={agencySubscription?.customerId || ""}
					amt={
						agencySubscription?.Subscription?.active === true
							? currentPlanDetails?.price || "$0"
							: "$0"
					}
					buttonCta={
						agencySubscription?.Subscription?.active === true
							? "Change Plan"
							: "Get Started"
					}
					highlightDescription="Want to modify your plan? You can do this here. If you have
					further question contact support@contact.com"
					highlightTitle="Plan Options"
					description={
						agencySubscription?.Subscription?.active === true
							? currentPlanDetails?.description || "Lets get started"
							: "Lets get Starte! Pick a plan that works best for you"
					}
					duration="/ month"
					features={
						agencySubscription?.Subscription?.active === true
							? currentPlanDetails?.features || []
							: currentPlanDetails?.features ||
							  pricingCards.find((pricing) => pricing.title === "Starter")
									?.features ||
							  []
					}
					title={
						agencySubscription?.Subscription?.active === true
							? currentPlanDetails?.title || "Starter"
							: "Starter"
					}
				/>
				{addOns.data.map((addOn) => (
					<PricingCard
						planExists={agencySubscription?.Subscription?.active === true}
						prices={prices.data}
						customerId={agencySubscription?.customerId || ""}
						key={addOn.id}
						amt={
							//@ts-ignore
							addOn.default_price?.unit_amount
								? //@ts-ignore
								  `$${addOn.default_price.unit_amount / 100}`
								: "$0"
						}
						buttonCta="Subscribe"
						description="Dedicated support line & teams channel for support"
						duration="/ month"
						features={[]}
						title={"24/7 priority support"}
						highlightTitle="Get support now!"
						highlightDescription="Get priority support and skip the long long with the click of a button."
					/>
				))}
			</div>
			<h2 className="text-2xl p-4">Payment History</h2>
			<Table className="bg-card border-[1px] border-border rounded-md">
				<TableHeader>
					<TableRow>
						<TableHead className="w-[200px]">Description</TableHead>
						<TableHead className="w-[200px]">Invoice Id</TableHead>
						<TableHead className="w-[300px]">Date</TableHead>
						<TableHead className="w-[200px]">Paid</TableHead>
						<TableHead className="text-right">Amout</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{allCharges.map((charge) => (
						<TableRow key={charge.id}>
							<TableCell>{charge.description}</TableCell>
							<TableCell className="text-muted-foreground">
								{charge.id}
							</TableCell>
							<TableCell>{charge.date}</TableCell>
							<TableCell>
								<p
									className={clsx("", {
										"text-emerald-500": charge.status.toLowerCase() === "paid",
										"text-orange-600":
											charge.status.toLowerCase() === "pending",
										"text-red-600": charge.status.toLowerCase() === "failed",
									})}
								>
									{charge.status.toUpperCase()}
								</p>
							</TableCell>
							<TableCell className="text-right">{charge.amount}</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</>
	)
}
