"use client";
import { GraphPlane } from "@/components/graph/graph-plane";
import { Badge } from "@/components/ui/badge";
import { getCourseGraphData } from "@/lib/course-utils";
import Link from "next/link";

// GraphPage component
export default function GraphPage() {
    const courseData = getCourseGraphData("CSCI4174");
    return (
        <main className="h-screen w-screen overflow-hidden">
            <GraphPlane
                renderNode={(node) => (
                    <Link href={"/" + node.label}>
                        <Badge className="text-blue-600 hover:bg-blue-100 bg-white border-gray-400 dark:text-blue-400 dark:hover:bg-blue-900/30 transition-colors dark:border-gray-700 dark:bg-gray-800">
                            {node.label}
                        </Badge>
                    </Link>
                )}
                {...courseData}
            />
        </main>
    );
}
