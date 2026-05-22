
"use client"

import React, { useState, useEffect } from 'react'
import { CRMSidebar } from './crm-sidebar'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Bell, User, Loader2, Cloud, CloudOff, RefreshCw, AlertCircle } from 'lucide-react'
import { useUser } from '@/firebase'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { usePersistenceStatus } from '@/components/providers/persistence-provider'

interface CRMLayoutProps {
  children: React.ReactNode
}

function PersistenceIndicator() {
  const { status, isOnline } = usePersistenceStatus();

  if (!isOnline) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-destructive/10 text-destructive text-[10px] font-bold uppercase tracking-widest border border-destructive/20 animate-pulse">
        <CloudOff className="h-3 w-3" />
        Offline: Changes Pending
      </div>
    );
  }

  switch (status) {
    case 'saving':
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest border border-primary/20">
          <RefreshCw className="h-3 w-3 animate-spin" />
          Synchronizing...
        </div>
      );
    case 'saved':
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 text-green-500 text-[10px] font-bold uppercase tracking-widest border border-green-500/20">
          <Cloud className="h-3 w-3" />
          Cloud Persistent
        </div>
      );
    case 'error':
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 text-red-500 text-[10px] font-bold uppercase tracking-widest border border-red-500/20">
          <AlertCircle className="h-3 w-3" />
          Sync Failure
        </div>
      );
    default:
      return null;
  }
}

export function CRMLayout({ children }: CRMLayoutProps) {
  const { user, loading } = useUser()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <CRMSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b bg-card px-6">
          <div className="flex flex-1 items-center gap-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                className="h-9 pl-9 pr-10 bg-muted/30 border-none focus-visible:ring-primary/20" 
                placeholder="Search intelligence..." 
              />
            </div>
            <PersistenceIndicator />
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative text-muted-foreground">
              <Bell className="h-5 w-5" />
              <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-primary border-2 border-card" />
            </Button>
            <div className="flex items-center gap-3 pl-2 border-l">
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <div className="flex flex-col items-end">
                    <span className="text-[11px] font-bold leading-tight">{user?.displayName || user?.email?.split('@')[0] || 'User'}</span>
                    <span className="text-[10px] text-muted-foreground leading-tight">{user?.email || 'Not logged in'}</span>
                  </div>
                  <Avatar className="h-9 w-9 border-2 border-primary/10">
                    <AvatarImage src={`https://picsum.photos/seed/${user?.uid}/40/40`} />
                    <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                  </Avatar>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-muted/20">
          <div className="container mx-auto p-6 max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
