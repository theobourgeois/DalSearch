"use client";

import { useState, useRef, useEffect, FormEvent, ReactNode } from "react";
import { MessageSquare, X, Send, Bot, Loader2, Sparkles, Mic, MicOff } from "lucide-react";
import { cn } from "@/lib/utils";

type Message = {
    role: "user" | "assistant";
    content: string;
};

const WELCOME: Message = {
    role: "assistant",
    content: "Hi! I'm **DalBot**, your AI course advisor.\n\nAsk me anything — finding courses, checking professor ratings, prerequisites, schedule planning, and more.",
};

const SUGGESTIONS = [
    "Best-rated CSCI profs",
    "Easy 2000-level courses",
    "No-prereq Winter courses",
];

// ── Markdown renderer ────────────────────────────────────────────────────────

function renderInline(text: string): ReactNode[] {
    const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
    return parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**"))
            return <strong key={i}>{part.slice(2, -2)}</strong>;
        if (part.startsWith("*") && part.endsWith("*"))
            return <em key={i}>{part.slice(1, -1)}</em>;
        return part;
    });
}

function MarkdownContent({ content }: { content: string }) {
    const lines = content.split("\n");
    const nodes: ReactNode[] = [];
    let listItems: ReactNode[] = [];

    const flushList = (key: string) => {
        if (listItems.length) {
            nodes.push(<ul key={key} className="space-y-0.5 my-1">{listItems}</ul>);
            listItems = [];
        }
    };

    lines.forEach((line, i) => {
        const key = String(i);
        const bullet = line.match(/^[\s]*[-*]\s+(.*)/);
        const h3 = line.match(/^###\s+(.*)/);
        const h2 = line.match(/^##\s+(.*)/);

        if (h3 || h2) {
            flushList(key + "ul");
            nodes.push(
                <p key={key} className="font-semibold text-[11px] uppercase tracking-wider text-slate-400 dark:text-gray-500 mt-3 mb-0.5 first:mt-0">
                    {(h3 ?? h2)![1]}
                </p>
            );
        } else if (bullet) {
            listItems.push(
                <li key={key} className="flex gap-1.5 items-start leading-snug">
                    <span className="text-yellow-500 mt-[3px] shrink-0 text-[10px]">●</span>
                    <span>{renderInline(bullet[1])}</span>
                </li>
            );
        } else if (line.trim() === "") {
            flushList(key + "ul");
            if (nodes.length) nodes.push(<div key={key} className="h-1.5" />);
        } else {
            flushList(key + "ul");
            nodes.push(<p key={key} className="leading-snug">{renderInline(line)}</p>);
        }
    });

    flushList("final");
    return <>{nodes}</>;
}

// ── Typing dots ──────────────────────────────────────────────────────────────

function TypingDots() {
    return (
        <div className="flex items-center gap-1 py-0.5">
            {[0, 1, 2].map((i) => (
                <span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-gray-500 animate-bounce"
                    style={{ animationDelay: `${i * 120}ms`, animationDuration: "900ms" }}
                />
            ))}
        </div>
    );
}

// ── Speech-to-text hook ──────────────────────────────────────────────────────

function useSpeech(onInterim: (t: string) => void, onFinal: (t: string) => void) {
    const recRef = useRef<any>(null);
    const [isListening, setIsListening] = useState(false);
    const [micError, setMicError] = useState<string | null>(null);
    const [supported, setSupported] = useState(false);

    useEffect(() => {
        const ua = navigator.userAgent;
        const hasSpeechApi = !!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition;
        // Web Speech API only works in Chrome/Edge — other Chromium forks (Opera, Brave, Vivaldi)
        // expose the API but lack the Google speech backend key, so recognition silently produces nothing
        // Opera/Vivaldi include "Chrome" in their UA but lack Google's speech API key
        const isEdge = /Edg\//.test(ua);
        const isChrome = /Chrome/.test(ua) && /Google Inc/.test(navigator.vendor) && !/OPR\/|Vivaldi/.test(ua) && !isEdge;
        setSupported(hasSpeechApi && (isChrome || isEdge));
    }, []);

    async function start() {
        setMicError(null);
        setIsListening(true);

        // Explicitly request mic permission first — this forces Chrome's permission prompt
        // and gives us a clear error if it's denied, rather than silently failing
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach((t) => t.stop());
        } catch {
            setIsListening(false);
            setMicError("Microphone access denied. Click the 🔒 icon in your address bar to allow it.");
            return;
        }

        const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SR) {
            setIsListening(false);
            setMicError("Speech recognition isn't supported. Try Chrome or Edge.");
            return;
        }

        try {
            const rec = new SR();
            rec.continuous = true;
            rec.interimResults = true;
            rec.lang = "en-US";

            rec.onresult = (e: any) => {
                let interim = "";
                let final = "";
                for (let i = e.resultIndex; i < e.results.length; i++) {
                    const t = e.results[i][0].transcript;
                    e.results[i].isFinal ? (final += t) : (interim += t);
                }
                if (final) onFinal(final);
                else onInterim(interim);
            };

            rec.onerror = (e: any) => {
                setIsListening(false);
                onInterim("");
                if (e.error === "not-allowed") {
                    setMicError("Microphone access denied. Allow it in your browser and try again.");
                } else if (e.error === "no-speech") {
                    // no-speech is non-fatal — just keep listening state, don't error
                } else if (e.error !== "aborted") {
                    setMicError(`Mic error: ${e.error}. Please try again.`);
                }
            };

            rec.onend = () => {
                setIsListening(false);
                onInterim("");
            };

            recRef.current = rec;
            rec.start();
        } catch (err) {
            setIsListening(false);
            setMicError("Could not start speech recognition. Please try again.");
            console.error("[DalBot mic]", err);
        }
    }

    function stop() {
        console.log("[DalBot mic] stopped");
        try { recRef.current?.stop(); } catch { /* ignore */ }
        recRef.current = null;
        setIsListening(false);
    }

    function toggle() {
        isListening ? stop() : start();
    }

    return { isListening, supported, toggle, micError, clearMicError: () => setMicError(null) };
}

// ── Main widget ───────────────────────────────────────────────────────────────

export function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([WELCOME]);
    const [input, setInput] = useState("");
    const [interim, setInterim] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const { isListening, supported: micSupported, toggle: toggleMic, micError, clearMicError } = useSpeech(
        setInterim,
        (final) => {
            setInput((prev) => (prev + " " + final).trimStart());
            setInterim("");
        }
    );

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading]);

    useEffect(() => {
        if (isOpen) setTimeout(() => inputRef.current?.focus(), 150);
    }, [isOpen]);

    async function send(e?: FormEvent) {
        e?.preventDefault();
        const text = (input + " " + interim).trim();
        if (!text || isLoading) return;

        setInput("");
        setInterim("");
        const userMsg: Message = { role: "user", content: text };
        setMessages((prev) => [...prev, userMsg]);
        setIsLoading(true);

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: [...messages, userMsg] }),
            });
            const data = await res.json();
            setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
        } catch {
            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: "Something went wrong. Please try again." },
            ]);
        } finally {
            setIsLoading(false);
        }
    }

    const showSuggestions = messages.length === 1 && !isLoading;
    const displayValue = input + interim;

    return (
        <>
            {/* ── Toggle button ── */}
            <button
                onClick={() => setIsOpen((o) => !o)}
                aria-label={isOpen ? "Close course advisor" : "Open course advisor"}
                className={cn(
                    "fixed bottom-4 left-4 z-50 w-12 h-12 rounded-full",
                    "flex items-center justify-center",
                    "bg-white dark:bg-gray-900",
                    "border border-slate-200/80 dark:border-gray-800",
                    "shadow-md hover:shadow-lg",
                    "transition-all duration-200 hover:scale-105 active:scale-95",
                )}
            >
                <span className={cn("absolute transition-all duration-200",
                    isOpen ? "opacity-100 rotate-0 scale-100" : "opacity-0 rotate-90 scale-75")}>
                    <X size={18} className="text-slate-500 dark:text-gray-400" />
                </span>
                <span className={cn("absolute transition-all duration-200",
                    isOpen ? "opacity-0 rotate-90 scale-75" : "opacity-100 rotate-0 scale-100")}>
                    <MessageSquare size={18} className="text-yellow-500" />
                </span>
            </button>

            {/* ── Chat panel ── */}
            <div
                className={cn(
                    "fixed z-50 flex flex-col overflow-hidden",
                    // Mobile: stretch edge-to-edge with small margin
                    "bottom-20 left-2 right-2 rounded-2xl",
                    // Desktop: fixed width anchored left
                    "sm:left-4 sm:right-auto sm:w-[340px] sm:rounded-xl",
                    "bg-white/95 dark:bg-gray-950/90 backdrop-blur-md",
                    "border border-slate-200/80 dark:border-gray-800/80",
                    "shadow-xl",
                    "transition-all duration-300 ease-out origin-bottom-left",
                    isOpen
                        ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                        : "opacity-0 scale-95 translate-y-3 pointer-events-none",
                )}
                // dvh shrinks when mobile keyboard opens — panel stays visible
                style={{ height: "min(520px, calc(100dvh - 96px))" }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200/80 dark:border-gray-800/80 shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200/60 dark:border-yellow-800/40 flex items-center justify-center shrink-0">
                            <Bot size={14} className="text-yellow-500" />
                        </div>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-sm font-semibold text-slate-900 dark:text-white">
                                <span className="text-yellow-500">Dal</span>Bot
                            </span>
                            <span className="text-[11px] text-slate-400 dark:text-gray-500 flex items-center gap-1">
                                <Sparkles size={10} className="text-yellow-400" />
                                AI Course Advisor
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="text-slate-400 hover:text-slate-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors rounded-md p-1 hover:bg-slate-100 dark:hover:bg-gray-800"
                    >
                        <X size={15} />
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5">
                    {messages.map((msg, i) => (
                        <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                            {msg.role === "assistant" && (
                                <div className="w-5 h-5 rounded-full bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200/60 dark:border-yellow-800/40 flex items-center justify-center shrink-0 mt-1 mr-1.5">
                                    <Bot size={11} className="text-yellow-500" />
                                </div>
                            )}
                            <div className={cn(
                                "max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm",
                                msg.role === "user"
                                    ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 rounded-br-sm"
                                    : "bg-slate-100/80 dark:bg-gray-800/80 text-slate-800 dark:text-gray-100 rounded-bl-sm"
                            )}>
                                <MarkdownContent content={msg.content} />
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex items-end gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200/60 dark:border-yellow-800/40 flex items-center justify-center shrink-0">
                                <Loader2 size={11} className="text-yellow-500 animate-spin" />
                            </div>
                            <div className="bg-slate-100/80 dark:bg-gray-800/80 rounded-2xl rounded-bl-sm px-3.5 py-2.5">
                                <TypingDots />
                            </div>
                        </div>
                    )}

                    <div ref={bottomRef} />
                </div>

                {/* Suggestions */}
                {showSuggestions && (
                    <div className="px-3 pb-2 flex flex-wrap gap-1.5 shrink-0">
                        {SUGGESTIONS.map((s) => (
                            <button
                                key={s}
                                onClick={() => { setInput(s); setTimeout(() => inputRef.current?.focus(), 50); }}
                                className="text-[11px] px-2.5 py-1 rounded-full border border-slate-200 dark:border-gray-700 text-slate-600 dark:text-gray-400 hover:border-yellow-400 hover:text-yellow-600 dark:hover:border-yellow-700 dark:hover:text-yellow-400 hover:bg-yellow-50/50 dark:hover:bg-yellow-900/10 transition-colors"
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                )}

                {/* Mic error banner */}
                {micError && (
                    <div className="mx-3 mb-2 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200/60 dark:border-red-800/40 flex items-center justify-between gap-2 shrink-0">
                        <span className="text-xs text-red-600 dark:text-red-400">{micError}</span>
                        <button onClick={clearMicError} className="text-red-400 hover:text-red-600 shrink-0">
                            <X size={12} />
                        </button>
                    </div>
                )}

                {/* Listening banner */}
                {isListening && !micError && (
                    <div className="mx-3 mb-2 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200/60 dark:border-red-800/40 flex items-center gap-2 shrink-0">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
                        <span className="text-xs text-red-600 dark:text-red-400 truncate">
                            {interim ? `"${interim}"` : "Listening… speak now"}
                        </span>
                    </div>
                )}

                {/* Input bar */}
                <form
                    onSubmit={send}
                    className="flex items-center gap-1.5 px-3 py-2.5 border-t border-slate-200/80 dark:border-gray-800/80 shrink-0"
                >
                    {/* Mic button */}
                    {micSupported && (
                        <button
                            type="button"
                            onClick={toggleMic}
                            aria-label={isListening ? "Stop recording" : "Start voice input"}
                            className={cn(
                                "w-8 h-8 rounded-lg shrink-0 flex items-center justify-center relative transition-all duration-200",
                                isListening
                                    ? "bg-red-500 text-white shadow-sm"
                                    : "bg-slate-100 dark:bg-gray-800 text-slate-500 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-gray-700"
                            )}
                        >
                            {isListening && (
                                <span className="absolute inset-0 rounded-lg animate-ping bg-red-400 opacity-50" />
                            )}
                            {isListening
                                ? <MicOff size={14} />
                                : <Mic size={14} />
                            }
                        </button>
                    )}

                    <input
                        ref={inputRef}
                        type="text"
                        value={displayValue}
                        onChange={(e) => {
                            setInput(e.target.value);
                            setInterim("");
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                send();
                            }
                        }}
                        placeholder={isListening ? "Speak now…" : "Ask about courses…"}
                        disabled={isLoading}
                        className={cn(
                            "flex-1 text-sm px-3 py-2 rounded-lg min-w-0",
                            "bg-slate-50 dark:bg-gray-900",
                            "border border-slate-200 dark:border-gray-700",
                            "text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-500",
                            "focus:outline-none focus:ring-1 focus:ring-yellow-400/60 focus:border-yellow-400/60",
                            "transition-colors disabled:opacity-50",
                            interim && "text-slate-400 dark:text-gray-500 italic"
                        )}
                    />

                    <button
                        type="submit"
                        disabled={isLoading || !displayValue.trim()}
                        className={cn(
                            "w-8 h-8 rounded-lg shrink-0 flex items-center justify-center",
                            "bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200",
                            "text-white dark:text-slate-900",
                            "transition-colors disabled:opacity-30 shadow-sm"
                        )}
                    >
                        <Send size={13} />
                    </button>
                </form>
            </div>
        </>
    );
}
