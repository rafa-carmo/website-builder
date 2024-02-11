"use client"
import {
	deleteFunnelPage,
	getFunnels,
	saveActivityLogsNotification,
	upsertFunnelPage,
} from "@/lib/queries"
import { FunnelPageSchema } from "@/lib/types"
import { zodResolver } from "@hookform/resolvers/zod"
import { FunnelPage } from "@prisma/client"
import { CopyPlusIcon, Trash } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { v4 } from "uuid"
import { z } from "zod"
import { Loading } from "../global/loading"
import { Button } from "../ui/button"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../ui/card"
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "../ui/form"
import { Input } from "../ui/input"
import { Toast } from "../ui/toast"
import { useToast } from "../ui/use-toast"

interface CreateFunnelPageProps {
	defaultData?: FunnelPage
	subaccountId: string
	funnelId: string
	order: number
}

export function CreateFunnelPage({
	defaultData,
	funnelId,
	order,
	subaccountId,
}: CreateFunnelPageProps) {
	const { toast } = useToast()
	const router = useRouter()

	const form = useForm<z.infer<typeof FunnelPageSchema>>({
		resolver: zodResolver(FunnelPageSchema),
		mode: "onChange",
		defaultValues: {
			name: "",
			pathName: "",
		},
	})

	// biome-ignore lint:
	useEffect(() => {
		if (defaultData) {
			form.reset({ name: defaultData.name, pathName: defaultData.pathName })
		}
	}, [defaultData])

	const onSubmit = async (values: z.infer<typeof FunnelPageSchema>) => {
		if (order !== 0 && !values.pathName)
			return form.setError("pathName", {
				message:
					"Pages other than the first page in the funnel require a path name example 'secondstep'.",
			})
		try {
			const response = await upsertFunnelPage(
				subaccountId,
				{
					...values,
					id: defaultData?.id || v4(),
					order: defaultData?.order || order,
					pathName: values.pathName || "",
				},
				funnelId,
			)

			await saveActivityLogsNotification({
				agencyId: undefined,
				description: `Updated a funnel page | ${response?.name}`,
				subaccountId: subaccountId,
			})

			toast({
				title: "Success",
				description: "Saves Funnel Page Details",
			})
			router.refresh()
		} catch (error) {
			console.error(error)
			toast({
				variant: "destructive",
				title: "Oppse!",
				description: "Could Save Funnel Page Details",
			})
		}
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Funnel Page</CardTitle>
				<CardDescription>
					Funnel pages are flow in the order they are created by default. You
					can move them around to change their order.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="flex flex-col gap-6"
					>
						<FormField
							disabled={form.formState.isSubmitting}
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem className="flex-1">
									<FormLabel>Name</FormLabel>
									<FormControl>
										<Input placeholder="Name" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							disabled={form.formState.isSubmitting || order === 0}
							control={form.control}
							name="pathName"
							render={({ field }) => (
								<FormItem className="flex-1">
									<FormLabel>Path Name</FormLabel>
									<FormControl>
										<Input
											placeholder="Path for the page"
											{...field}
											value={field.value?.toLowerCase()}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<div className="flex items-center gap-2">
							<Button
								className="w-22 self-end"
								disabled={form.formState.isSubmitting}
								type="submit"
							>
								{form.formState.isSubmitting ? <Loading /> : "Save Page"}
							</Button>

							{defaultData?.id && (
								<Button
									variant={"outline"}
									className="w-22 self-end border-destructive text-destructive hover:bg-destructive"
									disabled={form.formState.isSubmitting}
									type="button"
									onClick={async () => {
										const response = await deleteFunnelPage(defaultData.id)
										await saveActivityLogsNotification({
											agencyId: undefined,
											description: `Deleted a funnel page | ${response?.name}`,
											subaccountId: subaccountId,
										})
										router.refresh()
									}}
								>
									{form.formState.isSubmitting ? <Loading /> : <Trash />}
								</Button>
							)}
							{defaultData?.id && (
								<Button
									variant={"outline"}
									size={"icon"}
									disabled={form.formState.isSubmitting}
									type="button"
									onClick={async () => {
										const response = await getFunnels(subaccountId)
										const lastFunnelPage = response.find(
											(funnel) => funnel.id === funnelId,
										)?.FunnelPages.length

										await upsertFunnelPage(
											subaccountId,
											{
												...defaultData,
												id: v4(),
												order: lastFunnelPage ? lastFunnelPage : 0,
												visits: 0,
												name: `${defaultData.name} Copy`,
												pathName: `${defaultData.pathName}copy`,
												content: defaultData.content,
											},
											funnelId,
										)
										toast({
											title: "Success",
											description: "Saves Funnel Page Details",
										})
										router.refresh()
									}}
								>
									{form.formState.isSubmitting ? <Loading /> : <CopyPlusIcon />}
								</Button>
							)}
						</div>
					</form>
				</Form>
			</CardContent>
		</Card>
	)
}
