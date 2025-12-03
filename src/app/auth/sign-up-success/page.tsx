"use client";

import { useSignUp } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export default function Page() {
  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const { isLoaded, signUp, setActive } = useSignUp()
  const router = useRouter()

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isLoaded || !signUp) return
    
    setIsLoading(true)
    setError(null)

    try {
      const result = await signUp.attemptEmailAddressVerification({
        code,
      })

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId })
        
        // Sync user with Supabase profile
        await fetch("/api/auth/sync-user", {
          method: "POST",
        })
        
        setIsVerified(true)
        // Redirect after a short delay
        setTimeout(() => {
          router.push("/protected")
        }, 1500)
      } else {
        setError("Verification failed. Please check your code and try again.")
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError("An error occurred during verification")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    if (!isLoaded || !signUp) return
    
    try {
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" })
      setError(null)
      // You could show a success message here
    } catch {
      setError("Failed to resend code. Please try again.")
    }
  }

  if (isVerified) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Email Verified!</CardTitle>
              <CardDescription>Your account has been verified successfully</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Redirecting you to your account...
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Verify Your Email</CardTitle>
              <CardDescription>Enter the verification code sent to your email</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleVerify} className="flex flex-col gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="code">Verification Code</Label>
                  <Input
                    id="code"
                    type="text"
                    placeholder="Enter 6-digit code"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    disabled={isLoading}
                    maxLength={6}
                    className="text-center text-2xl tracking-widest"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Check your email (including spam folder) for the verification code
                  </p>
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button 
                  type="submit" 
                  className="w-full rounded-xl dark:bg-yellow-400 dark:hover:bg-yellow-300" 
                  disabled={isLoading || !code}
                >
                  {isLoading ? "Verifying..." : "Verify Email"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResend}
                  disabled={isLoading}
                  className="w-full"
                >
                  Resend Code
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
