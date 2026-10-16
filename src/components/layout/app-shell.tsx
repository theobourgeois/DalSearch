import { MobileNav } from "./mobile-nav";
import { SidebarContent } from "./sidebar";

/** The persistent app frame: sidebar on large screens, a top bar with a menu on small ones. */
export function AppShell({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-dvh lg:grid lg:grid-cols-[16.5rem_minmax(0,1fr)]">
            <aside className="sticky top-0 hidden h-dvh lg:block">
                <SidebarContent />
            </aside>
            <div className="min-w-0 lg:py-2.5 lg:pr-2.5">
                <MobileNav />
                {children}
            </div>
        </div>
    );
}
