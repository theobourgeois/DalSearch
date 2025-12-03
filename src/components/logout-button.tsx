"use client"

import { useClerk } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export function LogoutButton() {
  const router = useRouter()
  const { signOut } = useClerk()

  const logout = async () => {
    await signOut()
    router.push("/auth/login")
  }

  return <Button className="rounded-xl dark:bg-yellow-400 dark:hover:bg-yellow-300" onClick={logout}>Logout</Button>
}
