"use client"

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  LayoutDashboard, 
  User, 
  Hammer, 
  GraduationCap, 
  Trophy, 
  Briefcase, 
  Building2, 
  Rocket, 
  Target, 
  Quote, 
  FileText, 
  Database, 
  Link as LinkIcon, 
  Milestone, 
  Phone, 
  Globe,
  Settings,
  LogOut,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { signOut } from 'firebase/auth'
import { useAuth } from '@/firebase'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"

const navItems = [
  { label: 'Overview', icon: LayoutDashboard, href: '/dashboard', emoji: '🏠' },
  { label: 'Personal Profile', icon: User, href: '/profile', emoji: '👤' },
  { label: 'Skills & Expertise', icon: Hammer, href: '/skills', emoji: '🛠' },
  { label: 'Education', icon: GraduationCap, href: '/education', emoji: '🎓' },
  { label: 'Certifications', icon: Trophy, href: '/certifications', emoji: '🏆' },
  { label: 'Experience', icon: Briefcase, href: '/experience', emoji: '💼' },
  { label: 'Current Job', icon: Building2, href: '/career', emoji: '🏢' },
  { label: 'Projects & Products', icon: Rocket, href: '/projects', emoji: '🚀' },
  { label: 'Resume / CV', icon: FileText, href: '/resume', emoji: '📜' },
  { label: 'Documents', icon: Database, href: '/documents', emoji: '📁' },
  { label: 'Portfolios & Links', icon: LinkIcon, href: '/links', emoji: '🔗' },
  { label: 'Career Timeline', icon: Milestone, href: '/timeline', emoji: '📈' },
  { label: 'Contacts', icon: Phone, href: '/customers', emoji: '📞' },
  { label: 'Achievements & Awards', icon: Target, href: '/achievements', emoji: '🎯' },
  { label: 'Testimonials', icon: Quote, href: '/testimonials', emoji: '🌟' },
  { label: 'Public Share', icon: Globe, href: '/share', emoji: '🌐' },
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
    <Sidebar className="border-r bg-card">
      <SidebarHeader className="p-4 mb-2">
        <div className="flex items-center gap-2 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white shadow-lg shadow-primary/20 shrink-0">
            <Zap className="h-5 w-5 fill-current" />
          </div>
          <span className="font-headline text-xl font-bold tracking-tight text-foreground truncate">NexusCRM</span>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarMenu>
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton 
                  asChild 
                  isActive={isActive}
                  className={cn(
                    "transition-all duration-200",
                    isActive ? "bg-primary text-white shadow-md shadow-primary/20 hover:bg-primary/90 hover:text-white" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Link href={item.href} className="flex items-center gap-2.5 w-full">
                    <span className="text-sm shrink-0">{item.emoji}</span>
                    <span className="text-xs font-medium">{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t gap-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === '/settings'}>
              <Link href="/settings" className="flex items-center gap-3">
                <Settings className="h-4 w-4" />
                <span className="text-xs font-medium">Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={handleLogout}
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" />
              <span className="text-xs font-medium">Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}