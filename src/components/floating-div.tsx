"use client";

import React, { useEffect, useState } from "react";
import { Maximize2, Minimize2, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export const FloatingDiv = ({ children }: { children: React.ReactNode }) => {
    const { toasts } = useToast();
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        const toast = toasts.find((t) => t.title === "Class Added");
        if (toast) {
            setIsHovered(true);
            setTimeout(() => setIsHovered(false), 3000);
        }
    }, [toasts]);

    const toggleFullScreen = () => {
        setIsHovered(false);
        setIsFullScreen(!isFullScreen);
    };

    const variants = {
        calendar: {
            scale: 1,
            opacity: 1,
            transition: { duration: 0.5, ease: "easeInOut" },
        },
        hovered: {
            scale: 1.05,
            opacity: 1,
            transition: { duration: 0.5, ease: "easeInOut" },
        },
        fullscreen: {
            scale: 1,
            opacity: 1,
            transition: { duration: 0.5, ease: "easeInOut" },
        },
    };

    return (
        <AnimatePresence>
            {isFullScreen ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-hidden"
                >
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                        className="relative w-screen h-screen bg-white rounded-lg shadow-xl overflow-hidden"
                        style={{
                            width: "calc(100vw - 10rem)",
                            height: "calc(100vh - 5rem)",
                            overflowX: "scroll",
                        }}
                    >
                        <motion.button
                            onClick={toggleFullScreen}
                            className="absolute top-4 right-4 z-10 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-full p-2 transition-colors"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            <Minimize2 size={24} />
                        </motion.button>
                        <div className="min-w-[800px] h-full p-4 overflow-x-scroll">
                            {children}
                        </div>
                    </motion.div>
                </motion.div>
            ) : (
                <motion.div
                    className={cn(
                        "fixed bottom-4 right-4 bg-white/30 backdrop-blur-md border border-white/50 shadow-lg rounded-lg overflow-hidden transition-all duration-500 ease-in-out",
                        isHovered ? "w-48 h-48" : "w-12 h-12"
                    )}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    onClick={toggleFullScreen}
                    style={{ zIndex: 40, cursor: "pointer" }}
                    variants={variants}
                    initial="calendar"
                    animate={isHovered ? "hovered" : "calendar"}
                    whileHover={{ boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)" }}
                >
                    <AnimatePresence>
                        {isHovered ? (
                            <motion.div
                                key="preview"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="absolute inset-0 overflow-hidden"
                            >
                                <motion.div
                                    style={{
                                        transformOrigin: "top left",
                                    }}
                                    animate={{
                                        scale: 0.4,
                                        width: "250%",
                                        height: "250%",
                                    }}
                                    transition={{
                                        duration: 0,
                                        ease: "easeInOut",
                                    }}
                                >
                                    <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                                        {children}
                                    </div>
                                </motion.div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="calendar"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="flex items-center justify-center w-full h-full"
                            >
                                <Calendar size={24} className="text-gray-600" />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {isHovered && (
                        <motion.button
                            className="absolute bottom-2 right-2 text-gray-600 hover:text-gray-900 transition-colors"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            <Maximize2 size={20} />
                        </motion.button>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default FloatingDiv;
