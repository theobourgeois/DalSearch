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
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { useHref, useUniversity } from "@/components/university";

export function ForgotPasswordForm({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
    const university = useUniversity();
    const pagePath = useHref();
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [codeSent, setCodeSent] = useState(false)
  // A code works once, so remember it was accepted in case the new password is then rejected.
  const [codeVerified, setCodeVerified] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const sendCode = async () => {
    const { error } = await createClient().auth.resetPasswordForEmail(email.trim())
    return error
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const error = await sendCode()
    setIsLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    setCodeSent(true)
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!code || !password) {
      setError("Please enter both the verification code and new password")
      return
    }

    setIsLoading(true)
    setError(null)
    const supabase = createClient()

    if (!codeVerified) {
      const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: "recovery" })
      if (error) {
        setError(error.message)
        setIsLoading(false)
        return
      }
      setCodeVerified(true)
    }

    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message)
      setIsLoading(false)
      return
    }

    router.replace(pagePath("/protected"))
    router.refresh()
  }

  const handleResendCode = async () => {
    setIsLoading(true)
    setError(null)

    const error = await sendCode()
    setIsLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    setCode("")
    setCodeVerified(false)
    toast("We sent you a new code")
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Reset Your Password</CardTitle>
          <CardDescription>
            {codeSent 
              ? "Enter the verification code from your email and your new password"
              : `Type in your ${university.shortName} email and we'll send you a verification code`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {codeSent ? (
            <form onSubmit={handleResetPassword}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="code">Verification Code</Label>
                  <Input
                    id="code"
                    type="text"
                    placeholder="Enter code from email"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    disabled={isLoading || codeVerified}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    className="text-center text-2xl tracking-widest"
                  />
                  <p className="text-xs text-fg-muted">
                    Check your email (including spam folder) for the verification code
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">New Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter new password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                {error && <p className="text-sm text-danger">{error}</p>}
                <Button 
                  type="submit" 
                  variant="primary" className="w-full" 
                  disabled={isLoading || !code || !password}
                >
                  {isLoading ? "Resetting..." : "Reset Password"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResendCode}
                  disabled={isLoading}
                  className="w-full"
                >
                  Resend Code
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setCodeSent(false)
                    setCodeVerified(false)
                    setCode("")
                    setPassword("")
                    setError(null)
                  }}
                  disabled={isLoading}
                  className="w-full"
                >
                  Use Different Email
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleForgotPassword}>
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
                    disabled={isLoading}
                  />
                </div>
                {error && <p className="text-sm text-danger">{error}</p>}
                <Button 
                  type="submit" 
                  variant="primary" className="w-full" 
                  disabled={isLoading || !email}
                >
                  {isLoading ? "Sending..." : "Send Verification Code"}
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
