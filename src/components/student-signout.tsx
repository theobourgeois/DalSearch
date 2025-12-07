"use client";

import { useClerk } from "@clerk/nextjs";
import { useState } from "react";

export default function SignOutButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const { signOut } = useClerk();

  const handleSignOut = async () => {
    setLoading(true);
    setMessage("");

    try {
      await signOut();
      setMessage("Signed out successfully!");
    } catch (error) {
      setMessage("Error signing out: " + (error instanceof Error ? error.message : "Unknown error"));
    }

    setLoading(false);
  };

  return (
    <div>
      <button
        onClick={handleSignOut}
        disabled={loading}
        className="bg-red-600 text-white px-4 py-2 rounded"
      >
        {loading ? "Signing out..." : "Sign Out"}
      </button>
      {message && <p className="text-sm mt-2">{message}</p>}
    </div>
  );
}
