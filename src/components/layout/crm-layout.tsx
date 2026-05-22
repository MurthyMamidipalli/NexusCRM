"use client"

import React, { useState, useEffect } from 'react'
import { CRMSidebar } from './crm-sidebar'
import { Button } from '@/components/ui/button'
import { Bell, User, Loader2, Cloud, CloudOff, RefreshCw } from 'lucide-react'
import { useUser } from '@/firebase'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { usePersistenceStatus } from '@/components/providers/persistence-provider'
import { usePathname } from 'next/navigation'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'

interface CRMLayoutProps {
  children: React.ReactNode
}

const routeTitles: Record<string, string> = {
  '/dashboard': '🏠 Overview',
  '/profile': '👤 Personal Profile',
  '/skills': '🛠 Skills & Expertise',
  '/education': '🎓 Education',
  '/certifications': '🏆 Certifications',
  '/experience': '💼 Experience',
  '/career': '🏢 Current Job',
  '/projects': '🚀 Projects & Products',
  '/achievements': '🎯 Achievements',
  '/testimonials': '🌟 Testimonials',
  '/resume': '📜 Resume Vault',
  '/documents': '📁 Document Vault',
  '/links': '🔗 Portfolios & Links',
  '/timeline': '📈 Career Timeline',
  '/customers': '📞 Contact Hub',
  '/share': '🌐 Public Share',
  '/settings': '⚙️ Settings',
}

function PersistenceIndicator() {
  const { status, isOnline } = usePersistenceStatus();

  if (!isOnline) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-destructive/10 text-destructive text-[10px] font-bold uppercase tracking-widest border border-destructive/20 animate-pulse">
        <CloudOff className="h-3 w-3" />
        Offline
      </div>
    );
  }

  switch (status) {
    case 'saving':
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest border border-primary/20">
          <RefreshCw className="h-3 w-3 animate-spin" />
          Syncing...
        </div>
      );
    case 'saved':
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 text-green-500 text-[10px] font-bold uppercase tracking-widest border border-green-500/20">
          <Cloud className="h-3 w-3" />
          Saved
        </div>
      );
    default:
      return null;
  }
}

export function CRMLayout({ children }: CRMLayoutProps) {
  const { user, loading } = useUser()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const currentPageTitle = routeTitles[pathname] || 'Intelligence Hub'

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <CRMSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <header className="flex h-16 items-center justify-between border-b bg-card px-4 md:px-6 shrink-0">
            <div className="flex items-center gap-4 flex-1">
              <SidebarTrigger className="md:hidden" />
              <h2 className="text-sm font-bold font-headline truncate hidden sm:block">
                {currentPageTitle}
              </h2>
              <PersistenceIndicator />
            </div>

            <div className="flex items-center gap-2 md:gap-4">
              <Button variant="ghost" size="icon" className="relative text-muted-foreground hidden xs:flex">
                <Bell className="h-5 w-5" />
                <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-primary border-2 border-card" />
              </Button>
              <div className="flex items-center gap-3 pl-2 border-l border-border/50">
                {loading || !mounted ? (
                  <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
                ) : (
                  <>
                    <div className="flex flex-col items-end hidden sm:flex">
                      <span className="text-[11px] font-bold leading-tight truncate max-w-[120px]">
                        {user?.displayName || user?.email?.split('@')[0] || 'User'}
                      </span>
                      <span className="text-[10px] text-muted-foreground leading-tight truncate max-w-[120px] lowercase">
                        {user?.email || 'Not logged in'}
                      </span>
                    </div>
                    <Avatar className="h-8 w-8 md:h-9 md:w-9 border-2 border-primary/10">
                      <AvatarImage src={user?.photoURL || `https://picsum.photos/seed/${user?.uid}/40/40`} />
                      <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                    </Avatar>
                  </>
                )}
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto bg-muted/20">
            <div className="container mx-auto p-4 md:p-6 max-w-7xl">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
