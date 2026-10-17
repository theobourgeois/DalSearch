import { buildCalendarFeed } from "@/lib/calendar-feed";

export const dynamic = "force-dynamic";

/**
 * A student's schedule for calendar apps to subscribe to. They poll this address and can't sign in, so
 * the token in it is the only credential. Links end in .ics, which some calendar apps look for.
 */
export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
    const { token } = await params;
    const feed = await buildCalendarFeed(token.replace(/\.ics$/, ""), new URL(request.url).origin);
    if (feed === null) return new Response("Not found", { status: 404 });

    return new Response(feed, {
        headers: {
            "Content-Type": "text/calendar; charset=utf-8",
            "Content-Disposition": 'inline; filename="termly.ics"',
            "Cache-Control": "no-store",
        },
    });
}
