
"use client"

import React, { useState, useEffect } from 'react'
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
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogout = async () => {
    try {
      await signOut(auth)
      router.push('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  if (!mounted) return <div className="h-screen w-64 border-r bg-card" />

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-card p-4 transition-all duration-300">
      <div className="flex items-center gap-2 px-2 py-4 mb-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white shadow-lg shadow-primary/20">
          <Zap className="h-5 w-5 fill-current" />
        </div>
        <span className="font-headline text-xl font-bold tracking-tight text-foreground">NexusCRM</span>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto pr-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link key={item.href} href={item.href}>
              <div className={cn(
                "group flex items-center justify-between rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200",
                isActive 
                  ? "bg-primary text-white shadow-md shadow-primary/20" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}>
                <div className="flex items-center gap-2.5">
                  <span className="text-sm">{item.emoji}</span>
                  {item.label}
                </div>
              </div>
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto space-y-4 pt-4 border-t">
        <div className="flex flex-col gap-1">
          <Link href="/settings">
            <Button 
              variant="ghost" 
              size="sm" 
              className={cn(
                "w-full justify-start gap-3 px-3 transition-colors",
                pathname === '/settings' 
                  ? "bg-primary/10 text-primary font-bold" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </Link>
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
