"use client";

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { VerifyEmailForm } from "@/components/verify-email-form"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useHref, useUniversity } from "@/components/university";

export function SignUpForm({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
    const university = useUniversity();
    const pagePath = useHref();
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [repeatPassword, setRepeatPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [needsVerification, setNeedsVerification] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== repeatPassword) {
      setError("Passwords do not match")
      return
    }

    setIsLoading(true)
    const { data, error } = await createClient().auth.signUp({ email: email.trim(), password })
    setIsLoading(false)

    // The database decides who may sign up (university email domains plus anyone in allowed_emails)
    // and its refusal comes back as the error message.
    if (error) {
      setError(error.message)
      return
    }

    // Supabase doesn't say outright that an address is taken: it returns a user with no identities.
    if (data.user?.identities?.length === 0) {
      setError("An account with this email already exists. Log in instead.")
      return
    }

    if (data.session) {
      router.replace("/protected")
      router.refresh()
      return
    }

    setNeedsVerification(true)
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{needsVerification ? "Verify your email" : "Sign up"}</CardTitle>
          <CardDescription>
            {needsVerification
              ? "Enter the code we emailed you to finish signing up"
              : `Create an account with your ${university.shortName} email`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {needsVerification ? (
            <VerifyEmailForm email={email.trim()} onBack={() => setNeedsVerification(false)} />
          ) : (
            <form onSubmit={handleSignUp}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={university.emailExample}
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="password">Password</Label>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="repeat-password">Repeat Password</Label>
                  </div>
                  <Input
                    id="repeat-password"
                    type="password"
                    required
                    value={repeatPassword}
                    onChange={(e) => setRepeatPassword(e.target.value)}
                  />
                </div>
                {error && <p className="text-sm text-danger">{error}</p>}
                <Button type="submit" variant="primary" className="w-full" disabled={isLoading}>
                  {isLoading ? "Creating an account..." : "Sign up"}
                </Button>
              </div>
              <div className="mt-4 text-center text-sm">
                Already have an account?{" "}
                <Link href={pagePath("/auth/login")} className="underline underline-offset-4">
                  Login
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
