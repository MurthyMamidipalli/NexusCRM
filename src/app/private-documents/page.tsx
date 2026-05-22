"use client"

/**
 * @fileOverview This route has been removed and consolidated into the main Document Vault.
 * Reverts the separate Private Documents module to a simple redirect.
 */

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function RemovedPrivateDocumentsPage() {
  const router = useRouter()
  
  useEffect(() => {
    // Gracefully redirect users to the primary Document Vault
    router.replace('/dashboard')
  }, [router])

  return null
}
