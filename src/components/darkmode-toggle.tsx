"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

function getDarkMode() {
    if (typeof window === "undefined") return false;
    return localStorage?.getItem("darkMode") === "true";
}

export function DarkModeToggle() {
    const [darkMode, setDarkMode] = useState(getDarkMode());

    useEffect(() => {
        const root = window.document.documentElement;
        if (darkMode) {
            root.classList.add("dark");
        } else {
            root.classList.remove("dark");
        }
        localStorage.setItem("darkMode", darkMode.toString());
    }, [darkMode]);

    return (
        <button
            type="button"
            onClick={() => setDarkMode(!darkMode)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900 dark:border-gray-700 dark:text-gray-200 dark:hover:border-gray-600 dark:hover:bg-gray-800 dark:hover:text-white"
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
            {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
    );
}
