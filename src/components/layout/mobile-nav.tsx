"use client";

import { useState } from "react";
import { ListIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";
import { useSearchDialog } from "@/components/search/search-dialog";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { UniversitySwitcher } from "./university-switcher";
import { SidebarContent } from "./sidebar";

/** Top bar for small screens, with the sidebar in a slide-out menu. */
export function MobileNav() {
    const [open, setOpen] = useState(false);
    const { openSearch } = useSearchDialog();

    return (
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-line bg-canvas/90 px-3 backdrop-blur lg:hidden">
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Open menu">
                        <ListIcon />
                    </Button>
                </SheetTrigger>
                <SheetContent aria-describedby={undefined}>
                    <SheetTitle className="sr-only">Menu</SheetTitle>
                    <SidebarContent onNavigate={() => setOpen(false)} />
                </SheetContent>
            </Sheet>
            <UniversitySwitcher className="min-w-0" />
            <Button variant="ghost" size="icon" className="ml-auto" aria-label="Search courses" onClick={openSearch}>
                <MagnifyingGlassIcon />
            </Button>
        </header>
    );
}
