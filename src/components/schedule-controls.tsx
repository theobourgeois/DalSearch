"use client";
import { Download, Import } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { terms } from "@/lib/course-utils";
import {
    DOWNLOAD_FORMATS,
    DownloadFormat,
    useSchedule,
} from "@/store/schedule-store";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
    DialogTrigger,
} from "./ui/dialog";
import { ImportSchedule } from "./import-schedule";
import { Term } from "@/lib/types";

export function ScheduleControls() {
    const { downloadSchedule, term, setTerm } = useSchedule();

    const handleDownload = (format: DownloadFormat) => () => {
        downloadSchedule(format);
        return undefined;
    };

    return (
        <div className="flex gap-2 flex-wrap justify-end flex-col md:flex-row items-stretch w-full">
            <Select
                value={term}
                onValueChange={(value: Term) => setTerm(value)}
            >
                <SelectTrigger className="md:w-[180px]">
                    <SelectValue placeholder="Select term" />
                </SelectTrigger>
                <SelectContent>
                    {Object.keys(terms).map((term) => (
                        <SelectItem key={term} value={term}>
                            {terms[term as Term]}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        Download
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    {DOWNLOAD_FORMATS.map((format) => (
                        <DropdownMenuItem
                            key={format}
                            onClick={handleDownload(format)}
                        >
                            {format.toUpperCase()}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
            <Dialog>
                <DialogTrigger asChild>
                    <Button variant="default" className="gap-2">
                        <Import className="h-4 w-4" />
                        <span>Import Schedule</span>
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogTitle>Import Schedule</DialogTitle>
                    <DialogDescription>
                        Import your schedule from dalonline
                    </DialogDescription>
                    <ImportSchedule />
                </DialogContent>
            </Dialog>
        </div>
    );
}
