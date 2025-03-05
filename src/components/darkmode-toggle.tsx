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
            onClick={() => setDarkMode(!darkMode)}
            className="hover:text-yellow-400"
            title="Toggle dark mode"
        >
            {darkMode ? <Sun /> : <Moon />}
        </button>
    );
}
