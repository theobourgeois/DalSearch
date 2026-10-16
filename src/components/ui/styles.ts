/** Class strings shared by several primitives so floating surfaces and focus rings stay consistent. */

export const focusRing =
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:ring-offset-2 focus-visible:ring-offset-panel";

export const floatingSurface =
    "z-50 overflow-hidden rounded-card border border-line bg-panel p-1.5 text-fg shadow-[0_24px_60px_-18px_rgb(0_0_0/0.35)] outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95";

export const menuItem =
    "relative flex cursor-pointer select-none items-center gap-2.5 rounded-row px-3 py-2 text-sm font-medium outline-none transition-colors focus:bg-raised data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0";

export const fieldBase =
    "w-full border border-line-strong bg-transparent text-fg placeholder:text-fg-subtle transition-colors focus-visible:border-fg-subtle focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50";
