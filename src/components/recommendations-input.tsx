import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStoredState } from "@/hooks/use-stored-state";
import { cn } from "@/lib/utils";
import Fuse from "fuse.js";
import { SearchIcon } from "lucide-react";
import { useState, useMemo, useRef } from "react";
import ClickAwayListener from "react-click-away-listener";

type RecommendationInputProps<T extends unknown[]> = {
    storageKey?: string | null;
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
    autoFocus?: boolean;
};

function DefaultRenderRecommendation<T extends unknown[]>(
    item: T[number],
    isCurrentSelected: boolean
) {
    return (
        <div
            className={cn(
                "p-2 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-900 dark:bg-gray-800 cursor-pointer outline-none",
                isCurrentSelected && "bg-gray-200"
            )}
        >
            {item as unknown as string}
        </div>
    );
}

export function RecommendationInput<T extends unknown[]>({
    storageKey = null,
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
    autoFocus = false,
}: RecommendationInputProps<T>) {
    const [tabbedIndex, setTabbedIndex] = useState(0);
    const [value, setValue] = useStoredState("", storageKey);
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
            if (recommendations.length === 0) return;
            const recommendation = recommendations[tabbedIndex];
            if (!recommendation) return;
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
            if (recommendations.length === 0) return;
            setTabbedIndex((prev) => (prev + 1) % recommendations.length);
        }
        if (e.key === "ArrowUp") {
            if (recommendations.length === 0) return;
            setTabbedIndex(
                (prev) => (prev === 0 ? recommendations.length : prev) - 1
            );
        }
        if (e.key === "Tab" && !e.shiftKey) {
            if (recommendations.length === 0) return;
            e.preventDefault();
            setTabbedIndex((prev) => (prev + 1) % recommendations.length);
        }
        // shift + tab goes backwards
        if (e.shiftKey && e.key === "Tab") {
            if (recommendations.length === 0) return;
            e.preventDefault();
            setTabbedIndex((prev) =>
                prev === 0 ? recommendations.length - 1 : prev - 1
            );
        }
    };

    const handleClickCourse = (recommendation: T) => (e: React.MouseEvent) => {
        e.stopPropagation();
        onSelect(recommendation);
        if (closeOnSelect) {
            setRecommendations([]);
            setTabbedIndex(0);
        }
    };

    const handleSubmit = () => {
        const recommendation = recommendations[tabbedIndex] ?? recommendations[0];
        if (!recommendation) return;
        onSelect(recommendation);
        setTabbedIndex(0);
    };

    const handleFocus = () => {
        if (showAllItemsByDefault) {
            const items =
                value === ""
                    ? allItems
                    : fuse.search(value).map((result) => result.item);
            setRecommendations(items as T[]);
        }
    };

    return (
        <>
            <div
                onClick={handleFocus}
                className="relative px-3 shadow-sm rounded-lg w-full border border-slate-200 bg-white dark:border-gray-700 dark:bg-gray-900 focus-within:border-slate-300 dark:focus-within:border-gray-600 transition-colors"
                onKeyDown={handleKeyDown}
            >
                <div className="relative flex items-center h-10">
                    <SearchIcon
                        className="absolute left-0 text-slate-400 dark:text-gray-400"
                        size={16}
                    />
                    <Input
                        autoFocus={autoFocus}
                        className="h-full w-full pl-7 bg-transparent border-0 focus-visible:ring-0 shadow-none text-sm outline-none placeholder:text-slate-500 dark:text-white"
                        value={value}
                        onChange={handleChange}
                        placeholder={placeholder}
                    />
                </div>
                <ClickAwayListener
                    onClickAway={() => {
                        setRecommendations([]);
                    }}
                >
                    <div
                        className={cn("overflow-y-auto w-full flex flex-col", {
                            "rounded-b-2xl z-[9999] border-b-2 border-l-2 border-r-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 absolute left-0 top-[33px] px-2":
                                isHoveredList,
                        })}
                        style={{
                            maxHeight: open ? "300px" : 0,
                            opacity: open ? 1 : 0,
                            transition: "max-height height 0.2s",
                        }}
                    >
                        {recommendations.map((rec, index) => (
                            <div
                                key={JSON.stringify(rec)}
                                onClick={handleClickCourse(rec)}
                                className="recommendation-item"
                            >
                                {renderRecommendation(
                                    rec,
                                    index === tabbedIndex
                                )}
                            </div>
                        ))}
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
