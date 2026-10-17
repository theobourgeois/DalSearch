import Link from "next/link";

/** Only reached for addresses outside every university; pages inside one use [university]/not-found. */
export default function NotFound() {
    return (
        <main className="mx-auto max-w-md px-6 py-24">
            <h1 className="text-3xl font-black">Nothing here</h1>
            <p className="mt-3 text-fg-muted">That page doesn&apos;t exist.</p>
            <Link href="/" className="mt-6 inline-block font-bold underline underline-offset-4">
                Go home
            </Link>
        </main>
    );
}
