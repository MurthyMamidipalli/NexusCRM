
"use client"

import React from 'react'
import { CRMLayout } from '@/components/layout/crm-layout'
import { useUser } from '@/firebase'
import { Sparkles } from 'lucide-react'

export default function DashboardPage() {
  const { user } = useUser()

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User'

  return (
    <CRMLayout>
      <div className="flex h-[60vh] flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-500">
        <div className="mb-6 p-4 rounded-full bg-primary/10 text-primary">
          <Sparkles className="h-12 w-12" />
        </div>
        <h1 className="font-headline text-5xl font-bold tracking-tight mb-3">
          Welcome back, <span className="text-primary">{displayName}</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-md mx-auto leading-relaxed">
          Your professional Nexus Hub is ready. Manage your career intelligence, track your journey, and showcase your excellence to the world.
        </p>
      </div>
    </CRMLayout>
  )
}
