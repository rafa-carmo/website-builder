import { Navigation } from "@/components/site/navigation"
import { ClerkProvider } from "@clerk/nextjs"
import { dark } from "@clerk/themes"

export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<ClerkProvider appearance={{ baseTheme: dark }}>
			<main className="h-full">
				<Navigation />
				{children}
			</main>
		</ClerkProvider>
	)
}
