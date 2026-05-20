"use client"

import React from 'react'
import { CRMSidebar } from './crm-sidebar'
import { Toaster } from '@/components/ui/toaster'

interface CRMLayoutProps {
  children: React.ReactNode
}

export function CRMLayout({ children }: CRMLayoutProps) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <CRMSidebar />
      <main className="flex-1 overflow-y-auto custom-scrollbar relative">
        <div className="container mx-auto p-8 max-w-7xl animate-in fade-in duration-500">
          {children}
        </div>
      </main>
      <Toaster />
    </div>
  )
}