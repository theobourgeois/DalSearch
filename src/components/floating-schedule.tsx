"use client";

import React, { useEffect, useState } from "react";
import { Maximize2, Minimize2, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export const FloatingSchedule = ({
    children,
}: {
    children: React.ReactNode;
}) => {
    const { toasts } = useToast();
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const toast = toasts.find((t) => t.title === "Class Added");
        if (toast) {
            setIsHovered(true);
            setTimeout(() => setIsHovered(false), 3000);
        }
    }, [toasts]);

    const toggleFullScreen = () => {
        setIsHovered(false);
        setIsVisible(false);
        setTimeout(() => {
            setIsFullScreen(!isFullScreen);
            setIsVisible(true);
        }, 300);
    };

    return (
        <>
            {isFullScreen ? (
                <div
                    className={cn(
                        "fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-hidden transition-opacity duration-300",
                        isVisible ? "opacity-100" : "opacity-0"
                    )}
                >
                    <div
                        className={cn(
                            "relative bg-white rounded-lg shadow-xl overflow-hidden transition-all duration-300",
                            isVisible
                                ? "scale-100 opacity-100"
                                : "scale-95 opacity-0"
                        )}
                        style={{
                            width: "90vw",
                            height: "90vh",
                        }}
                    >
                        <button
                            onClick={toggleFullScreen}
                            className="fixed top-4 right-4 z-50 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-full p-2 transition-colors hover:scale-110 active:scale-90"
                            style={{
                                position: "fixed",
                                top: "calc(1rem)", // 2.5rem for the top margin of the container, 16px for the button's top position
                                right: "calc(1rem)", // 5rem for the right margin of the container, 16px for the button's right position
                            }}
                        >
                            <Minimize2 size={24} />
                        </button>
                        <div className="absolute inset-0 overflow-auto">
                            <div className="min-w-[800px] h-min p-4">
                                {children}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div
                    className={cn(
                        "fixed bottom-4 right-4 bg-white/30 backdrop-blur-md border border-white/50 shadow-lg rounded-lg overflow-hidden transition-all duration-300 ease-in-out",
                        isHovered ? "w-48 h-48" : "w-12 h-12",
                        isVisible
                            ? "opacity-100 scale-100"
                            : "opacity-0 scale-95"
                    )}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    onClick={toggleFullScreen}
                    style={{ zIndex: 40, cursor: "pointer" }}
                >
                    {isHovered ? (
                        <div
                            className="absolute inset-0 overflow-hidden transition-opacity duration-300"
                            style={{
                                opacity: isHovered ? 1 : 0,
                            }}
                        >
                            <div
                                style={{
                                    transform: "scale(0.4)",
                                    width: "250%",
                                    height: "250%",
                                    transformOrigin: "top left",
                                }}
                            >
                                <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                                    {children}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div
                            className="flex items-center justify-center w-full h-full transition-opacity duration-300"
                            style={{
                                opacity: isHovered ? 0 : 1,
                            }}
                        >
                            <Calendar size={24} className="text-gray-600" />
                        </div>
                    )}

                    {isHovered && (
                        <button className="absolute bottom-2 right-2 text-gray-600 hover:text-gray-900 transition-colors hover:scale-110 active:scale-90">
                            <Maximize2 size={20} />
                        </button>
                    )}
                </div>
            )}
        </>
    );
};

export default FloatingSchedule;
