"use client"

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  LayoutDashboard, 
  MessageSquare, 
  Megaphone, 
  Users, 
  Zap, 
  Instagram, 
  Calendar, 
  ShoppingBag, 
  Database, 
  BarChart3, 
  BadgePercent,
  Settings,
  LogOut,
  Sparkles,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { signOut } from 'firebase/auth'
import { useAuth } from '@/firebase'
import { Switch } from '@/components/ui/switch'

const navItems = [
  { label: 'Overview', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'Inbox', icon: MessageSquare, href: '/inbox', badge: 140 },
  { label: 'Campaigns', icon: Megaphone, href: '/campaigns', hasSub: true },
  { label: 'CRM', icon: Users, href: '/leads', hasSub: true },
  { label: 'Automations', icon: Zap, href: '/automations', hasSub: true },
  { label: 'Instagram', icon: Instagram, href: '/instagram' },
  { label: 'Appointments', icon: Calendar, href: '/appointments', hasSub: true },
  { label: 'Commerce', icon: ShoppingBag, href: '/commerce', hasSub: true },
  { label: 'Data Store', icon: Database, href: '/documents' },
  { label: 'Reports', icon: BarChart3, href: '/reports', hasSub: true },
  { label: 'Ads', icon: BadgePercent, href: '/ads', hasSub: true },
]

export function CRMSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const auth = useAuth()

  const handleLogout = async () => {
    try {
      await signOut(auth)
      router.push('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-card p-4 transition-all duration-300">
      <div className="flex items-center gap-2 px-2 py-4 mb-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
          <Zap className="h-5 w-5 fill-current" />
        </div>
        <span className="font-headline text-2xl font-bold tracking-tight text-foreground">wenext</span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link key={item.href} href={item.href}>
              <div className={cn(
                "group flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                isActive 
                  ? "bg-primary text-white shadow-md shadow-primary/20" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}>
                <div className="flex items-center gap-3">
                  <item.icon className={cn(
                    "h-5 w-5 transition-colors",
                    isActive ? "text-white" : "text-muted-foreground group-hover:text-primary"
                  )} />
                  {item.label}
                </div>
                <div className="flex items-center gap-2">
                  {item.badge && (
                    <span className={cn(
                      "flex h-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold",
                      isActive ? "bg-white text-primary" : "bg-primary/10 text-primary"
                    )}>
                      {item.badge}
                    </span>
                  )}
                  {item.hasSub && (
                    <ChevronRight className={cn("h-3 w-3", isActive ? "text-white/70" : "text-muted-foreground/50")} />
                  )}
                </div>
              </div>
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto space-y-4 pt-4 border-t">
        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-muted/50 border border-border/50">
          <div className="flex items-center gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-white border">
              <Sparkles className="h-3 w-3 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-bold">Nexus AI</span>
              <span className="text-[9px] text-muted-foreground">Open AI workspace</span>
            </div>
          </div>
          <Switch className="scale-75 data-[state=checked]:bg-primary" />
        </div>
        
        <div className="flex flex-col gap-1">
          <Button variant="ghost" size="sm" className="w-full justify-start gap-3 px-3 text-muted-foreground hover:text-foreground">
            <Settings className="h-4 w-4" />
            Settings
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleLogout}
            className="w-full justify-start gap-3 px-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  )
}