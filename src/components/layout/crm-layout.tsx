
"use client"

import React, { useState, useEffect } from 'react'
import { CRMSidebar } from './crm-sidebar'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Sparkles, Bell, User, Bot, Loader2 } from 'lucide-react'
import { useUser } from '@/firebase'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface CRMLayoutProps {
  children: React.ReactNode
}

export function CRMLayout({ children }: CRMLayoutProps) {
  const { user, loading } = useUser()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <CRMSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navigation Bar */}
        <header className="flex h-16 items-center justify-between border-b bg-card px-6">
          <div className="flex flex-1 items-center gap-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                className="h-9 pl-9 pr-10 bg-muted/30 border-none focus-visible:ring-primary/20" 
                placeholder="Search..." 
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground border">
                Ctrl K
              </div>
            </div>
            <Button variant="outline" className="h-9 gap-2 border-primary/20 text-primary hover:bg-primary/5">
              <Sparkles className="h-4 w-4" />
              Ask AI
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 border-none px-3 font-bold">
              Basic
            </Badge>
            <div className="flex items-center gap-2 rounded-full bg-card-foreground/5 border px-3 py-1.5">
              <Bot className="h-4 w-4 text-primary" />
              <span className="text-[11px] font-bold">AI Credits: 83.65</span>
            </div>
            <Button variant="ghost" size="icon" className="relative text-muted-foreground">
              <Bell className="h-5 w-5" />
              <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-primary border-2 border-card" />
            </Button>
            <div className="flex items-center gap-3 pl-2 border-l">
              {(loading || !mounted) ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <div className="flex flex-col items-end">
                    <span className="text-[11px] font-bold leading-tight">{user?.email?.split('@')[0] || 'User'}</span>
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

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-muted/20">
          <div className="container mx-auto p-6 max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
