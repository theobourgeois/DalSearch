import { Page } from "@/components/layout/page";
import { privatePage } from "@/lib/seo";

export const metadata = privatePage;

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return <Page breadcrumbs={[{ label: "Account" }]}>{children}</Page>;
}
