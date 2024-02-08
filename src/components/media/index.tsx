import { GetMediaFiles } from "@/lib/types"
import { FolderSearchIcon } from "lucide-react"
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "../ui/command"
import { MediaCard } from "./media-card"
import { MediaUploadButton } from "./upload-button"

interface MediaComponentProps {
	data: GetMediaFiles
	subaccountId: string
}

export function MediaComponent({ data, subaccountId }: MediaComponentProps) {
	return (
		<div className="flex flex-col gap-4 h-full w-full">
			<div className="flex justify-between items-center">
				<h1 className="text-4xl">Media Bucket</h1>
				<MediaUploadButton subaccountId={subaccountId} />
			</div>
			<Command className="bg-transparent">
				<CommandInput placeholder="Search for file name..." />
				<CommandList className="pb-40 max-h-full">
					<CommandEmpty>No Media Files</CommandEmpty>
					<CommandGroup heading="Media Files">
						<div className="flex flex-wrap gap-4 pt-4">
							{data?.Media.map((file) => (
								<CommandItem
									key={file.id}
									className="p-0 max-w-[300px] w-full rounded-lg !bg-transparent !font-medium !text-white"
								>
									<MediaCard file={file} />
								</CommandItem>
							))}
							{!data?.Media.length && (
								<div className="dark:text-muted text-slate-300 w-full h-full flex items-center justify-center">
									<FolderSearchIcon size={200} />
									<p className="text-muted-foreground">
										Empty: No files to show
									</p>
								</div>
							)}
						</div>
					</CommandGroup>
				</CommandList>
			</Command>
		</div>
	)
}
