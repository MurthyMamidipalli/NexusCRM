"use client"

import React, { useState, useEffect, useMemo } from 'react'
import { CRMSidebar } from './crm-sidebar'
import { Button } from '@/components/ui/button'
import { Bell, User, Cloud, CloudOff, RefreshCw } from 'lucide-react'
import { useUser, useFirestore, useDoc } from '@/firebase'
import { doc } from 'firebase/firestore'
import { collections } from '@/lib/firestore-service'
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
  '/documents': '📂 Document Vault',
  '/skills': '🛠 Skills & Expertise',
  '/education': '🎓 Education',
  '/certifications': '🏆 Certifications',
  '/experience': '💼 Experience',
  '/career': '🏢 Current Job',
  '/projects': '🚀 Projects & Products',
  '/achievements': '🎯 Achievements',
  '/testimonials': '🌟 Testimonials',
  '/resume': '📜 Resume Vault',
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
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-destructive/10 text-destructive text-[10px] font-bold uppercase tracking-widest border border-destructive/20 animate-pulse shrink-0">
        <CloudOff className="h-3 w-3" />
        Offline
      </div>
    );
  }

  switch (status) {
    case 'saving':
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest border border-primary/20 shrink-0">
          <RefreshCw className="h-3 w-3 animate-spin" />
          Syncing...
        </div>
      );
    case 'saved':
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 text-green-500 text-[10px] font-bold uppercase tracking-widest border border-green-500/20 shrink-0">
          <Cloud className="h-3 w-3" />
          Saved
        </div>
      );
    default:
      return null;
  }
}

export function CRMLayout({ children }: CRMLayoutProps) {
  const { user } = useUser()
  const db = useFirestore()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  // Explicitly reference the profile for real-time avatar sync
  const profileRef = useMemo(() => user ? doc(db, collections.PROFILES, user.uid) : null, [db, user])
  const { data: profile } = useDoc(profileRef, { silent: true })

  useEffect(() => {
    setMounted(true)
  }, [])

  const currentPageTitle = routeTitles[pathname] || 'Intelligence Hub'

  const displayAvatar = (profile as any)?.avatarUrl || user?.photoURL || `https://picsum.photos/seed/${user?.uid || 'default'}/40/40`;
  const displayUserName = (profile as any)?.fullName || user?.displayName || user?.email?.split('@')[0] || 'User';

  // Prevent hydration errors by ensuring we only render extension-targeted elements after mount
  if (!mounted) return null;

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <CRMSidebar />
        <div className="flex flex-1 flex-col overflow-hidden min-w-0">
          <header className="flex h-16 items-center justify-between border-b bg-card px-4 md:px-6 shrink-0 z-10">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <SidebarTrigger className="shrink-0" suppressHydrationWarning />
              <h2 className="text-sm font-bold font-headline truncate hidden sm:block">
                {currentPageTitle}
              </h2>
              <PersistenceIndicator />
            </div>

            <div className="flex items-center gap-2 md:gap-4 shrink-0">
              <Button variant="ghost" size="icon" className="relative text-muted-foreground hidden xs:flex" suppressHydrationWarning>
                <Bell className="h-5 w-5" />
                <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-primary border-2 border-card" />
              </Button>
              <div className="flex items-center gap-3 pl-2 border-l border-border/50">
                <div className="flex flex-col items-end hidden sm:flex">
                  <span className="text-[11px] font-bold leading-tight truncate max-w-[120px]">
                    {displayUserName}
                  </span>
                  <span className="text-[10px] text-muted-foreground leading-tight truncate max-w-[120px] lowercase">
                    {user?.email || 'Cloud Profile'}
                  </span>
                </div>
                <Avatar className="h-8 w-8 md:h-9 md:w-9 border-2 border-primary/10 shrink-0">
                  <AvatarImage src={displayAvatar} />
                  <AvatarFallback className="bg-primary/5 text-primary">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
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
