"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import StudentSignUporIn from "./student-sign-up-in";
import SignOutButton from "./student-signout";
import { User } from "@supabase/supabase-js";

export default function UserProfile() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const session = supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  return (
          user ? (
            <div className="space-y-2">
              <p className="text-sm font-medium">Signed in as:</p>
              <p className="text-sm">{user.email}</p>
              <SignOutButton />
            </div>
          ) : (
            <div className="space-y-2">
              <StudentSignUporIn/>
            </div>
          )
  );
}
