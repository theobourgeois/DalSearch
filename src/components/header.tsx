"use client";

import {
    Building2,
    Calendar,
    CompassIcon,
    GraduationCap,
    Menu,
    type LucideIcon,
    Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search } from "./search";
import { DarkModeToggle } from "./darkmode-toggle";
import { DalLogo } from "./dal-logo";
import { CourseByCode } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";

interface Props {
    courses: CourseByCode;
}

const navItems: {
    href: string;
    label: string;
    title: string;
    icon: LucideIcon;
}[] = [
    {
        href: "/explore",
        label: "Explore",
        title: "Explore courses",
        icon: CompassIcon,
    },
    {
        href: "/rooms",
        label: "Rooms",
        title: "Search rooms",
        icon: Building2,
    },
    {
        href: "/schedule",
        label: "Schedule",
        title: "Build a schedule",
        icon: Calendar,
    },
    {
        href: "/instructors",
        label: "Instructors",
        title: "Browse instructors",
        icon: Users,
    },
];

function isActivePath(pathname: string, href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Header({ courses }: Props) {
    const pathname = usePathname();

    return (
        <header className="sticky top-0 z-30 w-full border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:border-gray-800/80 dark:bg-gray-950/90 dark:text-white">
            <div className="mx-auto flex h-[72px] w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
                {/* Left side: Logo & Nav */}
                <div className="flex items-center gap-6 md:gap-8">
                    <Link
                        href="/"
                        className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
                    >
                        <div className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center">
                            <DalLogo />
                        </div>
                        <div className="hidden flex-col sm:flex">
                            <span className="text-xl font-bold leading-none tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                                <span className="text-yellow-500">Dal</span>Search
                            </span>
                        </div>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden lg:flex items-center gap-1">
                        {navItems.map(({ href, label }) => {
                            const isActive = isActivePath(pathname, href);
                            return (
                                <Link
                                    key={href}
                                    href={href}
                                    className={cn(
                                        "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                                        isActive
                                            ? "bg-slate-100 text-slate-900 dark:bg-gray-800 dark:text-white"
                                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-gray-300 dark:hover:bg-gray-800/50 dark:hover:text-white"
                                    )}
                                >
                                    {label}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* Right side: Search, Dark mode, Account */}
                <div className="flex flex-1 items-center justify-end gap-2 sm:gap-3">
                    <div className="w-full max-w-[260px] md:max-w-sm lg:max-w-md">
                        <Search
                            courses={courses}
                            isOnHeader
                            numberOfRecommendations={6}
                            hideWhenOnHomePage={false}
                            autoFocus={false}
                            showSubmitButton={false}
                            hoveredList
                            placeholder="Search courses..."
                            storageKey="header-search"
                        />
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                        <DarkModeToggle />
                        
                        <Link
                            href="/protected"
                            title="Account"
                            className="hidden sm:flex h-10 items-center gap-2 rounded-md bg-slate-900 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                        >
                            <GraduationCap className="h-4 w-4" />
                            <span>Account</span>
                        </Link>

                        {/* Mobile Menu */}
                        <Sheet>
                            <SheetTrigger asChild>
                                <button className="flex h-10 w-10 sm:hidden items-center justify-center rounded-full border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800 dark:hover:text-white">
                                    <Menu className="h-5 w-5" />
                                    <span className="sr-only">Toggle menu</span>
                                </button>
                            </SheetTrigger>
                            <SheetContent side="right" className="w-full max-w-xs sm:max-w-sm p-6 sm:hidden border-l-0 dark:border-gray-800">
                                <SheetHeader className="mb-6 text-left">
                                    <SheetTitle className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 flex items-center justify-center">
                                            <DalLogo />
                                        </div>
                                        <span className="text-xl font-bold leading-none tracking-tight text-slate-900 dark:text-white">
                                            <span className="text-yellow-500">Dal</span>Search
                                        </span>
                                    </SheetTitle>
                                </SheetHeader>
                                <div className="flex flex-col gap-1.5">
                                    {navItems.map(({ href, icon: Icon, label }) => {
                                        const isActive = isActivePath(pathname, href);
                                        return (
                                            <SheetClose asChild key={href}>
                                                <Link
                                                    href={href}
                                                    className={cn(
                                                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                                                        isActive
                                                            ? "bg-slate-100 text-slate-900 dark:bg-gray-800 dark:text-white"
                                                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-gray-400 dark:hover:bg-gray-800/50 dark:hover:text-white"
                                                    )}
                                                >
                                                    <Icon className="h-5 w-5" />
                                                    {label}
                                                </Link>
                                            </SheetClose>
                                        );
                                    })}
                                    
                                    <div className="my-2 h-px w-full bg-slate-200 dark:bg-gray-800" />
                                    
                                    <SheetClose asChild>
                                        <Link
                                            href="/protected"
                                            className={cn(
                                                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                                                isActivePath(pathname, "/protected")
                                                    ? "bg-slate-100 text-slate-900 dark:bg-gray-800 dark:text-white"
                                                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-gray-400 dark:hover:bg-gray-800/50 dark:hover:text-white"
                                            )}
                                        >
                                            <GraduationCap className="h-5 w-5" />
                                            Account
                                        </Link>
                                    </SheetClose>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </div>

            {/* Tablet Navigation (Scrollable row) */}
            <div className="hidden sm:block lg:hidden border-t border-slate-200/80 bg-slate-50/50 px-4 py-2.5 dark:border-gray-800/80 dark:bg-gray-950/50">
                <nav className="flex items-center gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {navItems.map(({ href, icon: Icon, label }) => {
                        const isActive = isActivePath(pathname, href);
                        return (
                            <Link
                                key={href}
                                href={href}
                                className={cn(
                                    "inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-slate-200/80 text-slate-900 dark:bg-gray-800 dark:text-white"
                                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-gray-400 dark:hover:bg-gray-800/50 dark:hover:text-white"
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                {label}
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </header>
    );
}
