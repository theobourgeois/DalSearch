"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { useDebounce } from "@uidotdev/usehooks";

interface InstructorsSearchProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
}

export function InstructorsSearch({
    searchTerm,
    setSearchTerm,
}: InstructorsSearchProps) {
    const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
    const debouncedSearchTerm = useDebounce(localSearchTerm, 300);

    useEffect(() => {
        setSearchTerm(debouncedSearchTerm);
    }, [debouncedSearchTerm, setSearchTerm]);

    return (
        <div className="relative ">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
                className="pl-10 w-full rounded-3xl dark:bg-gray-800"
                value={localSearchTerm}
                onChange={(e) => setLocalSearchTerm(e.target.value)}
                placeholder="Search by instructor name..."
            />
        </div>
    );
}
