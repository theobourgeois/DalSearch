"use client";
import { useState } from "react";
import { Graph, GraphProps } from "./graph";
import { useRefState } from "@/hooks/use-ref-state";
import Link from "next/link";
import { Badge } from "../ui/badge";

export function GraphPlane(props: GraphProps) {
    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });

    const handleMouseDown = (e: React.MouseEvent) => {
        let startX = e.clientX;
        let startY = e.clientY;

        const handleMouseMove = (e: MouseEvent) => {
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;

            startX = e.clientX;
            startY = e.clientY;

            setOffset((prev) => ({
                x: prev.x + deltaX,
                y: prev.y + deltaY,
            }));
        };

        handleMouseMove(e.nativeEvent);

        const handleMouseUp = () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
    };

    const handleScroll = (e: React.WheelEvent) => {
        const isAltPressed = e.altKey;
        if (!isAltPressed) return;
        e.stopPropagation();
        setScale((prev) => {
            const newScale = Math.max(0.5, Math.min(2, prev - e.deltaY / 100));
            const deltaScale = newScale - prev;

            const { clientX, clientY } = e;

            setOffset((prev) => ({
                x: prev.x - (clientX - prev.x) * deltaScale,
                y: prev.y - (clientY - prev.y) * deltaScale,
            }));

            return newScale;
        });
    };

    return (
        <div
            onWheel={handleScroll}
            onMouseDown={handleMouseDown}
            className="relative w-full h-full"
        >
            <svg className="w-full h-full absolute">
                <defs>
                    <pattern
                        id="dotPattern"
                        width="20"
                        height="20"
                        patternUnits="userSpaceOnUse"
                    >
                        <circle
                            cx="2"
                            cy="2"
                            r="1"
                            className="fill-slate-300 dark:fill-gray-700"
                        />
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#dotPattern)" />
            </svg>

            <div
                className="w-full h-full flex justify-center items-center origin-right"
                style={{
                    transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                }}
            >
                <Graph
                    renderNode={(node) => (
                        <Link href={"/" + node.label}>
                            <Badge className="text-blue-600 hover:bg-blue-100 bg-white border-gray-400 dark:text-blue-400 dark:hover:bg-blue-900/30 transition-colors dark:border-gray-700 dark:bg-gray-800">
                                {node.label}
                            </Badge>
                        </Link>
                    )}
                    {...props}
                />
            </div>
        </div>
    );
}
