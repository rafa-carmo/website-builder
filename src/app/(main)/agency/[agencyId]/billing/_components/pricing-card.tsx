"use client"

import { SubscriptionFormWrapper } from "@/components/forms/subscription-form/subscription-form-wrapper"
import { CustomModal } from "@/components/global/custom-modal"
import { Button } from "@/components/ui/button"
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import { PriceList } from "@/lib/types"
import { useModal } from "@/providers/modal-provider"
import { useSearchParams } from "next/navigation"

interface PricingCardProps {
	features: string[]
	buttonCta: string
	title: string
	amt: string
	duration: string
	highlightTitle: string
	highlightDescription: string
	description: string
	customerId: string
	prices: PriceList["data"]
	planExists: boolean
}

export function PricingCard({
	amt,
	buttonCta,
	customerId,
	duration,
	features,
	highlightDescription,
	highlightTitle,
	planExists,
	prices,
	description,
	title,
}: PricingCardProps) {
	const { setOpen } = useModal()
	const searchParams = useSearchParams()
	const plan = searchParams.get("plan")

	async function handleManagePlan() {
		setOpen(
			<CustomModal
				title="Manage Your Plan"
				subheading="You can change your plan at any time from the billings settings"
			>
				<SubscriptionFormWrapper
					customerId={customerId}
					planExists={planExists}
				/>
			</CustomModal>,
			async () => ({
				plans: {
					defaultPriceId: plan ? plan : "",
					plans: prices,
				},
			}),
		)
	}
	return (
		<Card className="flex flex-col justify-between lg:w-1/2">
			<div>
				<CardHeader className="flex flex-col md:flex-row justify-between">
					<div>
						<CardTitle>{title}</CardTitle>
						<CardDescription>{description}</CardDescription>
					</div>
					<p className="text-6xl font-bold">{amt}</p>
					<small className="text-xs font-light text-muted-foreground">
						{duration}
					</small>
				</CardHeader>
				<CardContent>
					<ul>
						{features.map((feature) => (
							<li
								key={feature}
								className="list-disc ml-4 text-muted-foreground"
							>
								{feature}
							</li>
						))}
					</ul>
				</CardContent>
			</div>
			<CardFooter>
				<Card className="w-full">
					<div className="flex flex-col md:!flex-row items-center justify-between rounded-lg border gap-4 p-4">
						<div>
							<p>{highlightTitle}</p>
							<p className="text-sm text-muted-foreground">
								{highlightDescription}
							</p>
						</div>

						<Button className="md:w-fit w-full" onClick={handleManagePlan}>
							{buttonCta}
						</Button>
					</div>
				</Card>
			</CardFooter>
		</Card>
	)
}
