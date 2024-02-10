"use server"

import Stripe from "stripe"
import { stripe } from "."
import { db } from "../db"

export const subscriptionCreated = async (
	subscription: Stripe.Subscription,
	customerId: string,
) => {
	try {
		const agency = await db.agency.findFirst({
			where: {
				customerId,
			},
			include: {
				Subscription: true,
			},
		})
		if (!agency) {
			throw new Error("Could not find a agency to upsert the subscription")
		}

		const data = {
			active: subscription.status === "active",
			agencyId: agency.id,
			customerId,
			currentPeriodEndDate: new Date(subscription.current_period_end * 1000),
			//@ts-ignore
			priceId: subscription.plan.id,
			subscritiptionId: subscription.id,
			//@ts-ignore
			plan: subscription.pause_collection.id,
		}

		const response = await db.subscription.upsert({
			where: {
				agencyId: agency.id,
			},
			update: data,
			create: data,
		})
	} catch (error) {}
}

export const getConnectAccountProducts = async (stripeAccount: string) => {
	const products = await stripe.products.list(
		{
			limit: 50,
			expand: ["data.default_price"],
		},
		{
			stripeAccount,
		},
	)

	return products.data
}
