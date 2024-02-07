import { ThemeProvider } from "@/providers/theme-provider"

import { Toaster } from "@/components/ui/toaster"
import ModalProvider from "@/providers/modal-provider"
import type { Metadata } from "next"
import { DM_Sans } from "next/font/google"
import "./globals.css"

const dm_sans = DM_Sans({ subsets: ["latin"] })

export const metadata: Metadata = {
	title: "Plura",
	description: "All in one Agency Solution",
}

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body className={dm_sans.className}>
				<ThemeProvider
					attribute="class"
					defaultTheme="system"
					enableSystem
					disableTransitionOnChange
				>
					<ModalProvider>
						{children}
						<Toaster />
					</ModalProvider>
				</ThemeProvider>
			</body>
		</html>
	)
}
