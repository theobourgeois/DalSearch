"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { useHref } from "@/components/university";

/** The last step of signing up: the code from the confirmation email. */
export function VerifyEmailForm({ email, onBack }: { email: string; onBack: () => void }) {
    const pagePath = useHref();
  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const { error } = await createClient().auth.verifyOtp({ email, token: code.trim(), type: "email" })
    if (error) {
      setError(error.message)
      setIsLoading(false)
      return
    }

    router.replace(pagePath("/protected"))
    router.refresh()
  }

  const handleResend = async () => {
    setError(null)
    const { error } = await createClient().auth.resend({ type: "signup", email })
    if (error) setError(error.message)
    else toast("We sent you a new code")
  }

  return (
    <form onSubmit={handleVerify}>
      <div className="flex flex-col gap-6">
        <div className="grid gap-2">
          <Label htmlFor="verification-code">Verification code</Label>
          <Input
            id="verification-code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="Enter code from email"
            required
            disabled={isLoading}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoFocus
          />
          <p className="text-sm text-fg-muted">
            We sent a code to {email}. Check your spam folder if you don&apos;t see it.
          </p>
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit" variant="primary" className="w-full" disabled={isLoading || !code}>
          {isLoading ? "Verifying..." : "Verify code"}
        </Button>
        <Button type="button" variant="outline" onClick={handleResend} disabled={isLoading} className="w-full">
          Resend code
        </Button>
        <Button type="button" variant="ghost" onClick={onBack} disabled={isLoading} className="w-full">
          Back
        </Button>
      </div>
    </form>
  )
}
