
"use client"

import React, { useState, useEffect } from 'react'
import { CRMLayout } from '@/components/layout/crm-layout'
import { Loader2 } from 'lucide-react'

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <CRMLayout>
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </CRMLayout>
    )
  }

  return (
    <CRMLayout>
      <div className="flex h-[60vh] flex-col items-center justify-center text-center">
        <h1 className="font-headline text-4xl font-bold tracking-tight mb-2">Welcome to your Overview</h1>
        <p className="text-muted-foreground italic">Your dashboard is ready for customization.</p>
      </div>
    </CRMLayout>
  )
}
