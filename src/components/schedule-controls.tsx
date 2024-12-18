"use client";
import { Download } from "lucide-react";
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
import { Term, terms } from "@/utils/course";
import {
    DOWNLOAD_FORMATS,
    DownloadFormat,
    useSchedule,
} from "@/store/schedule";

export function ScheduleControls() {
    const { downloadSchedule, term, setTerm } = useSchedule();

    const handleDownload = (format: DownloadFormat) => () => {
        downloadSchedule(format);
        return undefined;
    };

    return (
        <div className="flex flex-col space-y-4 p-4 bg-background border-b">
            <div className="flex items-center justify-between">
                <Select
                    value={term}
                    onValueChange={(value: Term) => setTerm(value)}
                >
                    <SelectTrigger className="w-[180px]">
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

                <div className="flex items-center space-x-2">
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
                </div>
            </div>
        </div>
    );
}
