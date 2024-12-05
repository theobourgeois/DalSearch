import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import Fuse from "fuse.js";
import { SearchIcon } from "lucide-react";
import { useState, useMemo, useRef } from "react";
import ClickAwayListener from "react-click-away-listener";

type RecommendationInputProps<T extends any[]> = {
    showAllItemsByDefault?: boolean;
    placeholder?: string;
    allItems: T;
    onSelect: (item: T[number]) => void;
    numOfRecommendations?: number | null;
    isHoveredList?: boolean;
    fuzzyKeys?: (keyof T[number])[];
    transformItem?: (item: T[number]) => string;
    renderRecommendation?: (
        item: T[number],
        isCurrentSelected: boolean
    ) => React.ReactNode;
    hasSubmitButton?: boolean;
    closeOnSelect?: boolean;
};

function DefaultRenderRecommendation<T extends any[]>(
    item: T[number],
    isCurrentSelected: boolean
) {
    return (
        <div
            className={cn(
                "p-2 hover:bg-gray-100 cursor-pointer outline-none",
                isCurrentSelected && "bg-gray-200"
            )}
        >
            {item}
        </div>
    );
}

export function RecommendationInput<T extends any[]>({
    showAllItemsByDefault = false,
    allItems,
    onSelect,
    numOfRecommendations = 5,
    isHoveredList,
    fuzzyKeys = [],
    renderRecommendation = DefaultRenderRecommendation,
    hasSubmitButton = false,
    closeOnSelect = true,
    placeholder = "Search for course...",
}: RecommendationInputProps<T>) {
    const [tabbedIndex, setTabbedIndex] = useState(0);
    const [value, setValue] = useState("");
    const [recommendations, setRecommendations] = useState<T[]>([]);
    const open = recommendations.length > 0;
    const fuse = useMemo(() => {
        return new Fuse(allItems, {
            includeScore: true,
            keys: fuzzyKeys as string[],
        });
    }, [fuzzyKeys, allItems]);
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setValue(value);

        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // Set new timer
        debounceTimerRef.current = setTimeout(() => {
            loadRecommendations(value);
        }, 200);
    };

    const loadRecommendations = (value: string) => {
        const results = fuse.search(value);
        const mappedResults = results.map((result) => result.item);
        const recommendations =
            numOfRecommendations === null
                ? mappedResults
                : mappedResults.slice(0, numOfRecommendations);
        setRecommendations(recommendations as T[]);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            const recommendation = recommendations[tabbedIndex];
            onSelect(recommendation);
            if (closeOnSelect) {
                setTabbedIndex(0);
                setRecommendations([]);
            }
        }
        if (e.key === "Escape") {
            setRecommendations([]);
            setTabbedIndex(0);
        }
        if (e.key === "ArrowDown") {
            setTabbedIndex((prev) => (prev + 1) % recommendations.length);
        }
        if (e.key === "ArrowUp") {
            setTabbedIndex(
                (prev) => (prev === 0 ? recommendations.length : prev) - 1
            );
        }
        if (e.key === "Tab" && !e.shiftKey) {
            e.preventDefault();
            setTabbedIndex((prev) => (prev + 1) % recommendations.length);
        }
        // shift + tab goes backwards
        if (e.shiftKey && e.key === "Tab") {
            e.preventDefault();
            setTabbedIndex((prev) =>
                prev === 0 ? recommendations.length - 1 : prev - 1
            );
        }
    };

    const handleClickCourse = (recommendation: T) => () => {
        onSelect(recommendation);
        if (closeOnSelect) {
            setRecommendations([]);
            setTabbedIndex(0);
        }
    };

    const handleSubmit = () => {
        onSelect(recommendations[tabbedIndex - 1]);
        setTabbedIndex(0);
    };

    const handleFocus = () => {
        if (showAllItemsByDefault) {
            const items =
                value === ""
                    ? allItems
                    : fuse.search(value).map((result) => result.item);
            setRecommendations(items);
        }
    };

    return (
        <>
            <div
                onClick={handleFocus}
                className="relative px-2 shadow-black rounded-xl w-full border-2 border-slate-200"
                onKeyDown={handleKeyDown}
            >
                <div className="relative">
                    <SearchIcon
                        className="absolute top-1/2 left-0 transform -translate-y-1/2"
                        size={18}
                    />
                    <Input
                        className="file:text-base focus-visible:ring-0 translate-x-6 p-0 rounded-none shadow-none outline-none border-none"
                        value={value}
                        onChange={handleChange}
                        placeholder={placeholder}
                    />
                </div>
                <ClickAwayListener onClickAway={() => setRecommendations([])}>
                    <div
                        className={cn("overflow-y-auto w-full flex flex-col", {
                            "rounded-b-2xl z-10 border-b-2 border-l-2 border-r-2 border-slate-200 bg-white absolute left-0 top-[33px] px-2":
                                isHoveredList,
                        })}
                        style={{
                            maxHeight: open ? "300px" : 0,
                            opacity: open ? 1 : 0,
                            transition: "max-height height 0.2s",
                        }}
                    >
                        {recommendations.map((rec, index) => {
                            return (
                                <div
                                    key={JSON.stringify(rec)}
                                    onClick={handleClickCourse(rec)}
                                >
                                    {renderRecommendation(
                                        rec,
                                        index === tabbedIndex
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </ClickAwayListener>
            </div>
            {hasSubmitButton && (
                <Button
                    onClick={handleSubmit}
                    className="w-max bg-yellow-400 hover:bg-yellow-500 text-black"
                >
                    Search
                </Button>
            )}
        </>
    );
}
