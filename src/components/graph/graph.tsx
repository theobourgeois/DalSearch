"use client";
import { useRef, useEffect, useState } from "react";
import type React from "react";
import { cn } from "@/lib/utils";

export type GraphNode = {
    label: string;
    children: string[];
};

function DefaultGraphLabel({ label }: { label: string }) {
    return (
        <div className="flex select-none cursor-pointer active:cursor-grab justify-center items-center w-max p-2 rounded-md bg-white border border-gray-300 shadow-sm">
            {label}
        </div>
    );
}

export type GraphProps = {
    root: GraphNode;
    nodes: Record<string, GraphNode>;
    renderNode?: (node: GraphNode) => JSX.Element;
    className?: string;
};

export function Graph({
    root,
    nodes,
    renderNode = (node) => <DefaultGraphLabel label={node.label} />,
    className,
}: GraphProps) {
    const [positions, setPositions] = useState<
        Record<string, { x: number; y: number }>
    >({});
    const containerRef = useRef<HTMLDivElement>(null);
    const svgRef = useRef<SVGSVGElement>(null);
    const nodeRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const [initialized, setInitialized] = useState(false);

    // Initialize node positions
    useEffect(() => {
        function handlePositionNodes() {
            if (!containerRef.current) return;

            const containerWidth = containerRef.current.clientWidth;

            const newPositions: Record<string, { x: number; y: number }> = {};

            let level = 0;
            let queue = [root.label];

            while (queue.length > 0) {
                const nextQueue: string[] = [];
                for (let i = 0; i < queue.length; i++) {
                    const nodeKey = queue[i];
                    newPositions[nodeKey] = {
                        x: containerWidth / 2 + (i - queue.length / 2) * 150,
                        y: 100 + level * 120,
                    };
                    nextQueue.push(...nodes[nodeKey].children);
                }
                queue = [...new Set(nextQueue)];
                level++;
            }

            setPositions(newPositions);

            // Wait for nodes to render, then measure their dimensions
            setTimeout(() => {
                const dimensions: Record<
                    string,
                    { width: number; height: number }
                > = {};

                Object.keys(nodes).forEach((key) => {
                    const node = nodeRefs.current[key];
                    if (node) {
                        dimensions[key] = {
                            width: node.offsetWidth,
                            height: node.offsetHeight,
                        };
                    }
                });

                setInitialized(true);
            }, 100);
        }

        window.addEventListener("resize", handlePositionNodes);
        handlePositionNodes();

        return () => window.removeEventListener("resize", handlePositionNodes);
    }, [root, nodes]);

    // // Handle node dragging
    // const handleMouseDownOnNode = (key: string) => (e: React.MouseEvent) => {
    //     e.preventDefault();

    //     let startX = e.clientX;
    //     let startY = e.clientY;

    //     const handleMouseMove = (e: MouseEvent) => {
    //         const deltaX = e.clientX - startX;
    //         const deltaY = e.clientY - startY;

    //         startX = e.clientX;
    //         startY = e.clientY;

    //         setPositions((prev) => {
    //             const newPositions = { ...prev };

    //             // Move the dragged node
    //             newPositions[key] = {
    //                 x: newPositions[key].x + deltaX,
    //                 y: newPositions[key].y + deltaY,
    //             };

    //             // Move connected nodes slightly
    //             for (const [nodeKey, nodePosition] of Object.entries(
    //                 newPositions
    //             )) {
    //                 if (nodeKey === key) continue;

    //                 const distance = Math.sqrt(
    //                     Math.pow(nodePosition.x - newPositions[key].x, 2) +
    //                         Math.pow(nodePosition.y - newPositions[key].y, 2)
    //                 );

    //                 if (distance < 300) {
    //                     const factor = 30 / Math.max(distance, 10);
    //                     newPositions[nodeKey] = {
    //                         x: nodePosition.x + deltaX * factor,
    //                         y: nodePosition.y + deltaY * factor,
    //                     };
    //                 }
    //             }

    //             return newPositions;
    //         });
    //     };

    //     const handleMouseUp = () => {
    //         document.removeEventListener("mousemove", handleMouseMove);
    //         document.removeEventListener("mouseup", handleMouseUp);
    //     };

    //     document.addEventListener("mousemove", handleMouseMove);
    //     document.addEventListener("mouseup", handleMouseUp);
    // };

    // const handleTouchStartOnNode = (key: string) => (e: React.TouchEvent) => {
    //     e.preventDefault();

    //     if (e.touches.length !== 1) return;

    //     const touch = e.touches[0];
    //     let startX = touch.clientX;
    //     let startY = touch.clientY;

    //     const handleTouchMove = (e: TouchEvent) => {
    //         if (e.touches.length !== 1) return;

    //         const touch = e.touches[0];
    //         const deltaX = touch.clientX - startX;
    //         const deltaY = touch.clientY - startY;

    //         startX = touch.clientX;
    //         startY = touch.clientY;

    //         setPositions((prev) => {
    //             const newPositions = { ...prev };

    //             // Move the dragged node
    //             newPositions[key] = {
    //                 x: newPositions[key].x + deltaX,
    //                 y: newPositions[key].y + deltaY,
    //             };

    //             // Move connected nodes slightly
    //             for (const [nodeKey, nodePosition] of Object.entries(
    //                 newPositions
    //             )) {
    //                 if (nodeKey === key) continue;

    //                 const distance = Math.sqrt(
    //                     Math.pow(nodePosition.x - newPositions[key].x, 2) +
    //                         Math.pow(nodePosition.y - newPositions[key].y, 2)
    //                 );

    //                 if (distance < 300) {
    //                     const factor = 30 / Math.max(distance, 10);
    //                     newPositions[nodeKey] = {
    //                         x: nodePosition.x + deltaX * factor,
    //                         y: nodePosition.y + deltaY * factor,
    //                     };
    //                 }
    //             }

    //             return newPositions;
    //         });
    //     };

    //     const handleTouchEnd = () => {
    //         document.removeEventListener("touchmove", handleTouchMove);
    //         document.removeEventListener("touchend", handleTouchEnd);
    //     };

    //     document.addEventListener("touchmove", handleTouchMove);
    //     document.addEventListener("touchend", handleTouchEnd);
    // };

    return (
        <div
            ref={containerRef}
            className={cn("relative w-full h-full", className)}
        >
            {/* SVG layer for lines */}
            <svg
                ref={svgRef}
                className="absolute top-0 left-0 w-[1000px] h-[1000px] pointer-events-none "
                style={{ zIndex: 1 }}
            >
                {initialized &&
                    Object.entries(nodes).map(([key, node]) =>
                        node.children.map((childKey) => {
                            if (!positions[key] || !positions[childKey])
                                return null;

                            // Calculate line coordinates from center of nodes
                            const x1 = positions[key].x;
                            const y1 = positions[key].y;
                            const x2 = positions[childKey].x;
                            const y2 = positions[childKey].y;

                            return (
                                <line
                                    key={`${key}-${childKey}`}
                                    x1={x1}
                                    y1={y1}
                                    x2={x2}
                                    y2={y2}
                                    className="dark:stroke-gray-300 stroke-gray-900"
                                    strokeWidth={1.5}
                                    strokeOpacity={0.6}
                                />
                            );
                        })
                    )}
            </svg>

            {Object.entries(nodes).map(([key, node]) => (
                <div
                    key={key}
                    ref={(el) => {
                        nodeRefs.current[key] = el;
                    }}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing"
                    style={{
                        left: positions[key]?.x || 0,
                        top: positions[key]?.y || 0,
                        touchAction: "none",
                        zIndex: 2,
                    }}
                    // onMouseDown={handleMouseDownOnNode(key)}
                    // onTouchStart={handleTouchStartOnNode(key)}
                >
                    {renderNode(node)}
                </div>
            ))}
        </div>
    );
}
