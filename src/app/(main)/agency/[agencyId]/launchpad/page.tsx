import { Button } from "@/components/ui/button"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import { getAgencyDetails } from "@/lib/queries"
import { CheckCircleIcon } from "lucide-react"
import Image from "next/image"

interface LaunchpadPageProps {
	params: {
		agencyId: string
	}
	searchParams: {
		code: string
	}
}

export default async function LaunchpadPage({
	params,
	searchParams,
}: LaunchpadPageProps) {
	const agencyDetails = await getAgencyDetails(params.agencyId)
	if (!agencyDetails) return

	const allDetailsExist =
		agencyDetails.address &&
		agencyDetails.address &&
		agencyDetails.agencyLogo &&
		agencyDetails.city &&
		agencyDetails.companyEmail &&
		agencyDetails.companyPhone &&
		agencyDetails.country &&
		agencyDetails.name &&
		agencyDetails.state &&
		agencyDetails.zipCode

	return (
		<div className="flex flex-col jsutify-center items-center">
			<div className="w-full h-full max-w-[800px]">
				<Card className="border-none">
					<CardHeader>
						<CardTitle>Lets get started!</CardTitle>
						<CardDescription>
							Follow the steps below to get your account setup.
						</CardDescription>
					</CardHeader>
					<CardContent className="flex flex-col gap-4">
						<div className="flex justify-between items-center w-full border p-4 roundend-lg gap-2">
							<div className="flex md:items-center gap-4 flex-col md:!flex-row">
								<Image
									src="/appstore.png"
									alt="app logo"
									width={80}
									height={80}
									className="rounded-md object-contain"
								/>
								<p>Save the website as a shortcut on your mobile device</p>
							</div>
							<Button>Start</Button>
						</div>

						<div className="flex justify-between items-center w-full border p-4 roundend-lg gap-2">
							<div className="flex md:items-center gap-4 flex-col md:!flex-row">
								<Image
									src="/stripelogo.png"
									alt="app logo"
									width={80}
									height={80}
									className="rounded-md object-contain"
								/>
								<p>
									Connect your stripe account to accept payments and see your
									dashboard
								</p>
							</div>
							<Button>Start</Button>
						</div>

						<div className="flex justify-between items-center w-full border p-4 roundend-lg gap-2">
							<div className="flex md:items-center gap-4 flex-col md:!flex-row">
								<Image
									src={agencyDetails?.agencyLogo}
									alt="app logo"
									width={80}
									height={80}
									className="rounded-md object-contain"
								/>
								<p>Fill in all your bussiness details</p>
							</div>
							{allDetailsExist ? (
								<CheckCircleIcon
									size={50}
									className="text-primary p-2 flex-shrink-0"
								/>
							) : (
								<Button>Start</Button>
							)}
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}