import Link from "next/link";
import { Page, PageHeader } from "@/components/layout/page";
import { Button } from "@/components/ui/button";

export default function NotFound() {
    return (
        <Page breadcrumbs={[{ label: "Not found" }]}>
            <PageHeader
                title="Nothing here"
                description="That course or page doesn't exist. Check the code and try again."
            />
            <div className="mt-6 flex gap-2">
                <Button asChild variant="primary">
                    <Link href="/explore">Explore courses</Link>
                </Button>
                <Button asChild variant="outline">
                    <Link href="/">Go home</Link>
                </Button>
            </div>
        </Page>
    );
}
