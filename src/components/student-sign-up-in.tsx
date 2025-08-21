"use client";

import { use, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function StudentSignUporIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loadingSignup, setLoadingSignup] = useState(false);
  const [loadingSignin, setLoadingSignin] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [message, setMessage] = useState("");

  const handleSignUp = async () => {
    setErrorMessage("");

    if (!email.endsWith("@dal.ca")) {
      setErrorMessage("Only Dalhousie student emails are allowed.");
      return;
    }

    setLoadingSignup(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setErrorMessage(error.message);
    } else {
      setMessage(
        "Sign up successful!."
      );
      setEmail("");
      setPassword("");
    }

    setLoadingSignup(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingSignin(true);
    setErrorMessage("");

    if (!email.endsWith("@dal.ca")) {
      setErrorMessage("Please use your Dal email address.");
      setLoadingSignin(false);
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMessage(error.message);
    } else {
      setErrorMessage("");
      console.log("Signed in:", data.user);
    }

    setLoadingSignin(false);
  };

  return (
    <div className="max-w-md mx-auto p-4 border rounded-xl shadow-md space-y-3">
      <h2 className="text-xl font-bold">Use Your Dalhousie Email</h2>

      <input
        type="email"
        placeholder="NetID@dal.ca"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full p-2 border rounded-xl dark:bg-gray-800"
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full p-2 border rounded-xl dark:bg-gray-800"
      />

    <div className="flex gap-4">
        <button
          onClick={handleSignUp}
          disabled={loadingSignup}
          className="w-1/2 bg-yellow-400 dark:hover:bg-yellow-300 hover:bg-yellow-500 text-black px-4 py-2 rounded-xl"
        >
          {loadingSignup ? "Signing Up..." : "Sign Up"}
        </button>

        <button
              onClick={handleSignIn}
              disabled={loadingSignin}
              className="w-1/2 bg-yellow-400 dark:hover:bg-yellow-300 hover:bg-yellow-500 text-black px-4 py-2 rounded-xl"
          >
              {loadingSignin ? "Signing in..." : "Sign In"}
          </button>
    </div>
      {errorMessage && <p className="w-full text-center text-sm text-red-500">{errorMessage}</p>}
      {message && <p className="w-full text-center text-sm text-green-500">{message}</p>}
    </div>
  );
}
