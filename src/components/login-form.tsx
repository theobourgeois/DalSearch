"use client";

import { cn } from "@/lib/utils"
import { useSignIn } from "@clerk/nextjs"
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
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect, useRef } from "react"

export function LoginForm({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [needsVerification, setNeedsVerification] = useState<"first" | "second" | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const isProcessingRef = useRef(false)
  const { isLoaded, signIn, setActive } = useSignIn()

  // Check for error in URL params
  useEffect(() => {
    const errorParam = searchParams.get("error")
    if (errorParam) {
      setError(errorParam)
    }
  }, [searchParams])

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isLoaded || !verificationCode) return
    
    if (isProcessingRef.current || isLoading) {
      return
    }
    
    isProcessingRef.current = true
    setIsLoading(true)
    setError(null)

    try {
      let result
      
      if (needsVerification === "first") {
        result = await signIn.attemptFirstFactor({
          strategy: "email_code",
          code: verificationCode,
        })
      } else if (needsVerification === "second") {
        result = await signIn.attemptSecondFactor({
          strategy: "email_code",
          code: verificationCode,
        })
      } else {
        setError("Invalid verification state")
        return
      }

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId })
        
        // Sync user with Supabase profile
        const response = await fetch("/api/auth/sync-user", {
          method: "POST",
        })
        
        if (!response.ok) {
          console.error("Failed to sync user with Supabase")
        }
        
        router.replace("/protected")
      } else {
        setError("Invalid verification code. Please try again.")
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError("Invalid verification code. Please try again.")
      }
    } finally {
      setIsLoading(false)
      setTimeout(() => {
        isProcessingRef.current = false
      }, 500)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isLoaded) return
    
    // Prevent multiple concurrent requests
    if (isProcessingRef.current || isLoading) {
      return
    }
    
    isProcessingRef.current = true
    setIsLoading(true)
    setError(null)
    setNeedsVerification(null)
    setVerificationCode("")

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      })

      if (result.status === "complete") {
        // Set the active session
        await setActive({ session: result.createdSessionId })
        
        // Sync user with Supabase profile
        const response = await fetch("/api/auth/sync-user", {
          method: "POST",
        })
        
        if (!response.ok) {
          console.error("Failed to sync user with Supabase")
        }
        
        // Redirect to protected page
        router.replace("/protected")
      } else {
        // Handle different sign-in statuses
        console.log("Sign-in status:", result.status)
        console.log("Supported first factors:", result.supportedFirstFactors)
        console.log("Supported second factors:", result.supportedSecondFactors)
        
        // Check if email verification is needed as first factor
        const emailFactor = result.supportedFirstFactors?.find(factor => factor.strategy === "email_code")
        
        if (result.status === "needs_first_factor" && emailFactor) {
          // Email verification required (common when signing in from new browser/device)
          try {
            // Get the email address ID from the factor
            const emailAddressId = emailFactor.emailAddressId
            if (emailAddressId) {
              await signIn.prepareFirstFactor({
                strategy: "email_code",
                emailAddressId: emailAddressId,
              })
              setNeedsVerification("first")
              setError("Please check your email for a verification code. You may need to verify your email when signing in from a new browser.")
            } else {
              setError("Email verification is required. Please check your email for a verification code.")
            }
          } catch (verifyError) {
            console.error("Failed to prepare email verification:", verifyError)
            setError("Email verification is required. Please check your email for a verification link or code.")
          }
        } else if (result.status === "needs_first_factor") {
          // MFA or other first factor required
          setError("Additional verification is required. Please complete the verification process.")
        } else if (result.status === "needs_second_factor") {
          // Second factor required - check if it's email verification
          const emailSecondFactor = result.supportedSecondFactors?.find(factor => factor.strategy === "email_code")
          
          if (emailSecondFactor) {
            // Email verification as second factor (common when signing in from new browser)
            try {
              const emailAddressId = emailSecondFactor.emailAddressId
              if (emailAddressId) {
                await signIn.prepareSecondFactor({
                  strategy: "email_code",
                  emailAddressId: emailAddressId,
                })
                setNeedsVerification("second")
                setError("Please check your email for a verification code. This is required when signing in from a new browser or device.")
              } else {
                setError("Email verification is required. Please check your email for a verification code.")
              }
            } catch (verifyError) {
              console.error("Failed to prepare second factor email verification:", verifyError)
              setError("Email verification is required. Please check your email for a verification code or link.")
            }
          } else {
            // Other second factor (like TOTP, SMS, etc.)
            const availableFactors = result.supportedSecondFactors?.map(f => f.strategy).join(", ") || "none"
            console.log("Available second factors:", availableFactors)
            setError("Second factor authentication is required. Please complete the additional verification step.")
          }
        } else if (result.status === "needs_new_password") {
          // Password reset required
          setError("Your password needs to be reset. Please use the forgot password link.")
        } else if (result.status === "needs_identifier") {
          // Identifier required (shouldn't happen here, but handle it)
          setError("Please enter your email address.")
        } else {
          // Unknown status - log it and show helpful error
          console.error("Unexpected sign-in status:", result.status)
          setError("Unable to complete sign in. Please verify your email address and try again. If the problem persists, contact support.")
        }
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        // Clerk provides user-friendly error messages
        setError(error.message)
      } else {
        setError("An error occurred during sign in")
      }
    } finally {
      setIsLoading(false)
      // Reset the ref after a small delay to prevent rapid clicking
      setTimeout(() => {
        isProcessingRef.current = false
      }, 500)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>Enter your Dalhousie email below to login to your account</CardDescription>
        </CardHeader>
        <CardContent>
          {needsVerification ? (
            <form onSubmit={handleVerification}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="verification-code">Verification Code</Label>
                  <Input
                    id="verification-code"
                    type="text"
                    placeholder="Enter code from email"
                    required
                    disabled={isLoading}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    autoFocus
                  />
                  <p className="text-sm text-muted-foreground">
                    We sent a verification code to {email}. Please enter it above.
                  </p>
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button type="submit" className="w-full rounded-xl dark:bg-yellow-400 dark:hover:bg-yellow-300" disabled={isLoading || !verificationCode}>
                  {isLoading ? "Verifying..." : "Verify Code"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setNeedsVerification(null)
                    setVerificationCode("")
                    setError(null)
                  }}
                  disabled={isLoading}
                  className="w-full"
                >
                  Back to Login
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleLogin}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="NetID@dal.ca"
                    required
                    disabled={isLoading}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="password">Password</Label>
                    <Link
                      href="/auth/forgot-password"
                      className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                    >
                      Forgot your password?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    required
                    disabled={isLoading}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button type="submit" className="w-full rounded-xl dark:bg-yellow-400 dark:hover:bg-yellow-300" disabled={isLoading}>
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
              </div>
              <div className="mt-4 text-center text-sm">
                Don&apos;t have an account?{" "}
                <Link href="/auth/sign-up" className="underline underline-offset-4">
                  Sign up
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
