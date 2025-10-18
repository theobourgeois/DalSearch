"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

export default function SignOutButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSignOut = async () => {
    setLoading(true);
    setMessage("");

    const supabase = createClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
      setMessage("Error signing out: " + error.message);
    } else {
      setMessage("Signed out successfully!");
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
