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
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
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
        // Handle other statuses (like needs verification)
        setError("Please verify your email address before signing in.")
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
        </CardContent>
      </Card>
    </div>
  )
}
