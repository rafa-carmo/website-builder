"use client"

import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { pricingCards } from "@/lib/constants"
import { useModal } from "@/providers/modal-provider"
import { Plan } from "@prisma/client"
import { StripeElementsOptions } from "@stripe/stripe-js"
import clsx from "clsx"

import { Loading } from "@/components/global/loading"
import { getStripe } from "@/lib/stripe/stripe-client"
import { Elements } from "@stripe/react-stripe-js"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { SubscriptionForm } from "."

interface SubscriptionFormWrapperProps {
	customerId: string
	planExists: boolean
}

export function SubscriptionFormWrapper({
	customerId,
	planExists,
}: SubscriptionFormWrapperProps) {
	const { data, setClose } = useModal()
	const router = useRouter()
	const [selectedPriceId, setSelectedPriceId] = useState<Plan | "">(
		data?.plans?.defaultPriceId || "",
	)
	const [subscription, setSubscription] = useState<{
		subscriptionId: string
		clientSecret: string
	}>({ subscriptionId: "", clientSecret: "" })

	const options: StripeElementsOptions = useMemo(
		() => ({
			clientSecret: subscription.clientSecret,
			appearance: {
				theme: "flat",
			},
		}),
		[subscription],
	)

	// biome-ignore lint:
	useEffect(() => {
		if (!selectedPriceId) return
		const createSecret = async () => {
			const subscriptionResponse = await fetch(
				"/api/stripe/create-subscription",
				{
					method: "POST",
					headers: {
						"Content-Type": "application",
					},
					body: JSON.stringify({
						customerId,
						priceId: selectedPriceId,
					}),
				},
			)
			const subscriptionResponseData = await subscriptionResponse.json()

			setSubscription({
				clientSecret: subscriptionResponseData.clientSecret,
				subscriptionId: subscriptionResponseData.subscriptionId,
			})
		}
		if (planExists) {
			toast({
				title: "Success",
				description: "Your plan has been successfuly upgraded!",
			})
			setClose()
			router.refresh()
		}

		createSecret()
	}, [data, selectedPriceId, customerId])

	return (
		<div className="border-none transition-all">
			<div className="flex flex-col gap-4">
				{data.plans?.plans.map((plan) => (
					<Card
						key={plan.id}
						className={clsx("relative cursor-pointer transition-all", {
							"border-primary": selectedPriceId === plan.id,
						})}
						onClick={() => {
							setSelectedPriceId(plan.id as Plan)
						}}
					>
						<CardHeader>
							<CardTitle>
								${plan.unit_amount ? plan.unit_amount / 100 : "0"}
								<p className="text-sm text-muted-foreground">{plan.nickname}</p>
								<p className="text-sm text-muted-foreground">
									{pricingCards.find((p) => p.priceId === plan.id)?.description}
								</p>
							</CardTitle>
						</CardHeader>
						{selectedPriceId === plan.id && (
							<div className="w-2 h-2 bg-emerald-500 rounded-full absolute top-4 right-4" />
						)}
					</Card>
				))}

				{options.clientSecret && !planExists && (
					<>
						<h1 className="text-xl">Payment Method</h1>
						<Elements stripe={getStripe()} options={options}>
							<SubscriptionForm selectedPriceId={selectedPriceId} />
						</Elements>
					</>
				)}

				{!options.clientSecret && selectedPriceId && (
					<div className="flex items-center justify-center w-full h-40">
						<Loading />
					</div>
				)}
			</div>
		</div>
	)
}
