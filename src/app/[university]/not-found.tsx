"use client";

import Link from "next/link";
import { Page, PageHeader } from "@/components/layout/page";
import { Button } from "@/components/ui/button";
import { useHref } from "@/components/university";

export default function NotFound() {
    const pagePath = useHref();
    return (
        <Page breadcrumbs={[{ label: "Not found" }]}>
            <PageHeader
                title="Nothing here"
                description="That course or page doesn't exist. Check the code and try again."
            />
            <div className="mt-6 flex gap-2">
                <Button asChild variant="primary">
                    <Link href={pagePath("/explore")}>Explore courses</Link>
                </Button>
                <Button asChild variant="outline">
                    <Link href={pagePath("/")}>Go home</Link>
                </Button>
            </div>
        </Page>
    );
}
