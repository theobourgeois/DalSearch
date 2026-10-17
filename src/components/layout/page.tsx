import Link from "next/link";
import { CaretRightIcon } from "@phosphor-icons/react/dist/ssr";
import { links, SITE_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { UniversityName } from "./university-name";

export type Crumb = { label: string; href?: string };

function Breadcrumbs({ items }: { items: Crumb[] }) {
    return (
        <nav
            aria-label="Breadcrumb"
            className="flex h-12 items-center gap-2 border-b border-line px-5 text-[13.5px] font-medium text-fg-subtle lg:px-6"
        >
            {items.map((item, index) => {
                const last = index === items.length - 1;
                return (
                    <span key={item.label} className="flex min-w-0 items-center gap-2">
                        {item.href && !last ? (
                            <Link href={item.href} className="truncate hover:text-fg">
                                {item.label}
                            </Link>
                        ) : (
                            <span className={cn("truncate", last && "font-bold text-fg-muted")}>{item.label}</span>
                        )}
                        {!last && <CaretRightIcon className="size-3.5 shrink-0" />}
                    </span>
                );
            })}
        </nav>
    );
}

function PageFooter() {
    const link = "font-bold text-fg-muted hover:text-fg";
    return (
        <footer className="mt-14 flex flex-wrap gap-x-4 gap-y-2 border-t border-line pt-5 text-[13px] text-fg-subtle">
            <span>
                {SITE_NAME} is not affiliated with <UniversityName />. Made by{" "}
                <a href={links.theo} className={link}>
                    Théo Bourgeois
                </a>{" "}
                and{" "}
                <a href={links.chris} className={link}>
                    Chris Langille
                </a>
                .
            </span>
            <span className="flex gap-4 sm:ml-auto">
                <a href={links.source} className={link}>
                    Open source
                </a>
                <a href={links.coffee} className={link}>
                    Buy me a coffee
                </a>
            </span>
        </footer>
    );
}

/** The rounded content panel every page renders into. */
export function Page({ breadcrumbs, children }: { breadcrumbs: Crumb[]; children: React.ReactNode }) {
    return (
        <main className="min-h-[calc(100dvh-3.5rem)] bg-panel lg:min-h-[calc(100dvh-1.25rem)] lg:rounded-panel lg:border lg:border-line">
            <Breadcrumbs items={breadcrumbs} />
            <div className="px-5 pb-8 sm:px-8 lg:px-10">
                {children}
                <PageFooter />
            </div>
        </main>
    );
}

type PageHeaderProps = {
    title: React.ReactNode;
    /** A large second line, e.g. the course name under its code. */
    subtitle?: React.ReactNode;
    /** A smaller descriptive line. */
    description?: React.ReactNode;
    /** Rendered next to the title, e.g. a term switcher. */
    titleAddon?: React.ReactNode;
};

export function PageHeader({ title, subtitle, description, titleAddon }: PageHeaderProps) {
    return (
        <header className="pt-8 lg:pt-9">
            <div className="flex items-center gap-3.5">
                <h1 className="text-[2.125rem] font-black leading-none tracking-display sm:text-[2.875rem]">{title}</h1>
                {titleAddon}
            </div>
            {subtitle && (
                <p className="mt-2 text-lg font-medium tracking-tight text-fg-body sm:text-[1.4375rem]">{subtitle}</p>
            )}
            {description && <p className="mt-2.5 text-base font-medium text-fg-muted">{description}</p>}
        </header>
    );
}

/** The row of actions under a page header; `trailing` sits on the right. */
export function PageActions({ children, trailing }: { children?: React.ReactNode; trailing?: React.ReactNode }) {
    return (
        <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-3">
            {children}
            {trailing && <div className="ml-auto flex items-center gap-1 text-fg-muted">{trailing}</div>}
        </div>
    );
}

/** Main content with a details column on the right (stacked below on small screens). */
export function PageColumns({ children, aside }: { children: React.ReactNode; aside: React.ReactNode }) {
    return (
        <div className="grid gap-10 pt-8 lg:grid-cols-[minmax(0,1fr)_17.5rem] lg:gap-12">
            <div className="min-w-0">{children}</div>
            <aside className="self-start border-t border-line pt-8 lg:border-l lg:border-t-0 lg:pl-7 lg:pt-0">
                {aside}
            </aside>
        </div>
    );
}

export function SectionHeader({
    title,
    children,
    className,
}: {
    title: React.ReactNode;
    children?: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={cn("flex flex-wrap items-center justify-between gap-3", className)}>
            <h2 className="text-lg font-bold tracking-tight">{title}</h2>
            {children}
        </div>
    );
}

/** A small muted heading inside the details column. */
export function AsideHeading({ children }: { children: React.ReactNode }) {
    return <h3 className="mb-3 text-[13px] font-bold text-fg-subtle">{children}</h3>;
}

export function AsideDivider() {
    return <hr className="my-5 border-line" />;
}
