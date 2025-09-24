"use client";
import React, { useState } from "react";
import FlaggedReviews from "@/components/flagged-review";

interface Admin {
  email: string;
  role: string;
}

export default function OwnerPanel({ admins }: { admins: Admin[] }) {
    const [adminList, setAdminList] = useState<Admin[]>(admins);
    const [newEmail, setNewEmail] = useState("");
    
    const handleDeassign = async (email: string) => {
    if (!confirm(`Are you sure you want to remove ${email} as admin?`)) return;

    try {
        const res = await fetch("/api/admins/deassign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
        });

        const data = await res.json();

        if (!res.ok) {
        alert("Failed to deassign admin: " + data.error);
        return;
        }

        alert(`${email} has been removed as admin.`);

        setAdminList((prev) => prev.filter((a) => a.email !== email));

    } catch (err) {
        console.error(err);
        alert("Something went wrong.");
    }
    };

    const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail) return alert("Please enter an email.");
    if (!confirm(`Are you sure you want to make ${newEmail} an admin?`)) return;

    try {
      const res = await fetch("/api/admins/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert("Failed to assign admin: " + data.error);
        return;
      }

      alert(`${newEmail} is now an admin.`);
      setAdminList((prev) => [...prev, { email: newEmail, role: "admin" }]);
      setNewEmail("");
    } catch (err) {
      console.error(err);
      alert("Something went wrong.");
    }
  };


  return (
    <section className="mt-8">
    <h2 className="text-2xl font-semibold">Admin List</h2>
    <div className="flex flex-col sm:flex-row gap-12 mt-4">
        <div className="flex-1 mr-4 bg-gray-100 dark:bg-gray-800 p-4 rounded-xl shadow max-h-96 overflow-y-auto">
        {admins.length > 0 ? (
            admins.map((a) => (
            <div key={a.email} className="flex justify-between items-center mt-2">
                <span>{a.email}</span>
                <button
                className="rounded-xl dark:bg-yellow-400 dark:hover:bg-yellow-300 inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 dark:focus-visible:ring-gray-300 bg-gray-900 text-gray-50 shadow hover:bg-gray-900/90 dark:text-gray-900 h-9 px-4 py-2 rounded-xl dark:bg-yellow-400 dark:hover:bg-yellow-300"
                onClick={() => handleDeassign(a.email)}
                >
                Remove
                </button>
            </div>
            ))
        ) : (
            <div className="flex justify-between items-center mt-2">
                <p>No admins yet.</p>
            </div>
        )}
        </div>

        <div className="flex-1 ml-4 bg-gray-100 dark:bg-gray-800 p-4 rounded-xl shadow">
        <form
            onSubmit={handleAssign}
            className="mt-6 flex flex-col sm:flex-row gap-2 items-center"
        >
            <input
            type="email"
            placeholder="Enter user email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className=" rounded-xl border border-gray-300 dark:border-gray-600 rounded px-3 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-yellow-400 dark:bg-gray-700 dark:text-white"
            required
            />
            <button
            type="submit"
            className="rounded-xl dark:bg-yellow-400 dark:hover:bg-yellow-300 inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 dark:focus-visible:ring-gray-300 bg-gray-900 text-gray-50 shadow hover:bg-gray-900/90 dark:text-gray-900 h-9 px-4 py-2 rounded-xl dark:bg-yellow-400 dark:hover:bg-yellow-300"
            >
            Assign Admin
            </button>
        </form>
        </div>
      </div>
      <h3 className="text-xl font-semibold mt-6">Flagged Reviews</h3>
            <FlaggedReviews />
    </section>
  );
}