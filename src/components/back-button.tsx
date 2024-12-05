'use client'

import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"

export function BackButton() {
  const router = useRouter()

  const handleBack = () => {
    router.back()
  }

  return (
    <Button
      variant="ghost"
      onClick={handleBack}
      className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
    >
      <ChevronLeft className="mr-1 h-4 w-4" />
      Back
    </Button>
  )
}


