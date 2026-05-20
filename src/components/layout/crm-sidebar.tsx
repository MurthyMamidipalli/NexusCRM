
"use client"

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  LayoutDashboard, 
  UserPlus, 
  Users, 
  Trello, 
  CheckSquare, 
  FileText, 
  Settings, 
  LogOut,
  Target,
  CalendarDays
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { signOut } from 'firebase/auth'
import { useAuth } from '@/firebase'

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'Leads', icon: UserPlus, href: '/leads' },
  { label: 'Pipeline', icon: Trello, href: '/pipeline' },
  { label: 'Customers', icon: Users, href: '/customers' },
  { label: 'Tasks', icon: CheckSquare, href: '/tasks' },
  { label: 'Meetings', icon: CalendarDays, href: '/meetings' },
  { label: 'Documents', icon: FileText, href: '/documents' },
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
    <div className="flex h-screen w-64 flex-col border-r bg-sidebar p-4 transition-all duration-300">
      <div className="flex items-center gap-3 px-2 py-6 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
          <Target className="h-6 w-6 text-primary-foreground" />
        </div>
        <span className="font-headline text-xl font-bold tracking-tight text-foreground">Nexus CRM</span>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link key={item.href} href={item.href}>
              <div className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive 
                  ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )}>
                <item.icon className={cn(
                  "h-5 w-5 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary"
                )} />
                {item.label}
              </div>
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto space-y-1 pt-4 border-t border-sidebar-border/50">
        <Link href="/settings">
          <div className={cn(
            "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
            pathname === '/settings' ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
          )}>
            <Settings className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
            Settings
          </div>
        </Link>
        <Button 
          variant="ghost" 
          onClick={handleLogout}
          className="w-full justify-start gap-3 px-3 py-2.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </Button>
      </div>
    </div>
  )
}
