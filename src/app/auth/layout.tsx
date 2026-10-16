import { Page } from "@/components/layout/page";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return <Page breadcrumbs={[{ label: "Account" }]}>{children}</Page>;
}
