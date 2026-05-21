"use client"

import React, { useMemo } from 'react'
import { CRMLayout } from '@/components/layout/crm-layout'
import { Button } from '@/components/ui/button'
import { 
  Plus, 
  BarChart3, 
  Send, 
  FileText, 
  Inbox, 
  Users, 
  Clock, 
  Phone, 
  Sparkles, 
  Activity, 
  CheckCircle2, 
  Loader2,
  TrendingUp,
  MessageCircle,
  Zap,
  ShoppingBag,
  CreditCard,
  Bot,
  MessageSquare,
  Calendar,
  ChevronRight
} from 'lucide-react'
import { useUser, useFirestore, useCollection } from '@/firebase'
import { collection, query, limit } from 'firebase/firestore'
import { collections } from '@/lib/firestore-service'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export default function DashboardPage() {
  const { user } = useUser()
  const db = useFirestore()
  const leadsQuery = useMemo(() => query(collection(db, collections.LEADS), limit(100)), [db])
  const { data: leads, loading } = useCollection(leadsQuery)

  const stats = useMemo(() => {
    return [
      { label: 'Total Messages', value: '131', trend: '1.6%', up: true, icon: MessageCircle },
      { label: 'Active Chats', value: '189', trend: '1618.2%', up: true, icon: MessageSquare },
      { label: 'Total Contacts', value: leads?.length.toString() || '6,259', trend: '2.4%', up: true, icon: Users },
    ]
  }, [leads])

  const platformServices = [
    { name: 'WhatsApp', active: true },
    { name: 'Templates', active: true },
    { name: 'Campaigns', active: true },
    { name: 'Commerce', active: true },
    { name: 'Automation', active: true },
    { name: 'Live Chat', active: true },
    { name: 'Scheduling', active: true },
    { name: 'Payments', active: true },
    { name: 'AI Agents', active: true },
    { name: 'WA Flows', active: true },
  ]

  return (
    <CRMLayout>
      <div className="space-y-6">
        {/* Header Greeting */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-headline text-3xl font-bold tracking-tight">
              Good morning, {user?.email || 'sahith0489@gmail.com'}
            </h1>
            <div className="flex items-center gap-2 mt-1 text-muted-foreground text-xs">
              <Clock className="h-3 w-3" />
              <span>{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="bg-white border-border gap-2">
              <BarChart3 className="h-4 w-4" /> Reports
            </Button>
            <Button size="sm" className="bg-primary hover:bg-primary/90 gap-2">
              <Plus className="h-4 w-4" /> New Campaign
            </Button>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="rounded-full bg-white border-primary/20 text-primary h-9 px-4 gap-2">
            <Send className="h-3 w-3" /> Send Campaign
          </Button>
          <Button variant="outline" size="sm" className="rounded-full bg-white border-primary/20 text-primary h-9 px-4 gap-2">
            <FileText className="h-3 w-3" /> Create Template
          </Button>
          <Button variant="outline" size="sm" className="rounded-full bg-white border-primary/20 text-primary h-9 px-4 gap-2">
            <Inbox className="h-3 w-3" /> View Inbox
          </Button>
          <Button variant="outline" size="sm" className="rounded-full bg-white border-primary/20 text-primary h-9 px-4 gap-2">
            <Users className="h-3 w-3" /> View Contacts
          </Button>
        </div>

        {/* Status Banners */}
        <div className="grid grid-cols-1 gap-4">
          {/* WhatsApp Status Banner */}
          <div className="flex items-center justify-between rounded-xl bg-primary p-1 pl-4 text-white shadow-lg shadow-primary/10">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 fill-white" />
                <span className="text-sm font-bold">+91 78010 91065</span>
                <Badge className="bg-white/20 text-white border-none text-[10px] h-5">Live</Badge>
              </div>
              <div className="hidden items-center gap-3 md:flex">
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Msg Limit:</span>
                <div className="w-48">
                  <Progress value={2} className="h-1.5 bg-white/20" />
                </div>
                <span className="text-[10px] font-bold">0/2,000</span>
              </div>
              <div className="hidden items-center gap-2 md:flex">
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Quality:</span>
                <Badge className="bg-white text-primary border-none text-[10px] h-5 font-bold">GREEN</Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" className="bg-white/10 hover:bg-white/20 text-white h-8 text-[11px] font-bold">View Profile</Button>
              <Button size="sm" variant="ghost" className="h-8 w-8 rounded-lg hover:bg-white/10 text-white">
                <Activity className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* AI Insights Banner */}
          <div className="flex items-center justify-between rounded-xl bg-accent p-4 text-white shadow-lg shadow-accent/10 relative overflow-hidden group cursor-pointer">
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center gap-4 relative z-10">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold">AI Lead Insights</h3>
                  <Badge className="bg-white/20 text-white border-none text-[9px] uppercase h-4">Beta</Badge>
                </div>
                <p className="text-[11px] opacity-80">20 May 2026 • 6 conversations analysed</p>
              </div>
            </div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[11px] font-bold">Ready</span>
              </div>
              <ChevronRight className="h-4 w-4 opacity-50" />
            </div>
          </div>
        </div>

        {/* Platform Health Section */}
        <Card className="border-none shadow-sm overflow-hidden bg-white/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10 text-green-500 border border-green-500/20">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Platform Health</h3>
                  <p className="text-[10px] text-muted-foreground">9 of 10 services active</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="w-32">
                  <Progress value={90} className="h-1.5 bg-muted" />
                </div>
                <span className="text-[11px] font-bold text-green-500">90%</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {platformServices.map((service) => (
                <div key={service.name} className="flex items-center justify-between rounded-lg border bg-white p-2.5 transition-all hover:border-primary/50">
                  <div className="flex items-center gap-2">
                    {service.name.toLowerCase().includes('whatsapp') ? <Phone className="h-3 w-3 text-muted-foreground" /> : 
                     service.name.toLowerCase().includes('template') ? <FileText className="h-3 w-3 text-muted-foreground" /> :
                     service.name.toLowerCase().includes('campaign') ? <Send className="h-3 w-3 text-muted-foreground" /> :
                     service.name.toLowerCase().includes('commerce') ? <ShoppingBag className="h-3 w-3 text-muted-foreground" /> :
                     service.name.toLowerCase().includes('automation') ? <Zap className="h-3 w-3 text-muted-foreground" /> :
                     service.name.toLowerCase().includes('chat') ? <MessageCircle className="h-3 w-3 text-muted-foreground" /> :
                     service.name.toLowerCase().includes('schedul') ? <Calendar className="h-3 w-3 text-muted-foreground" /> :
                     service.name.toLowerCase().includes('payment') ? <CreditCard className="h-3 w-3 text-muted-foreground" /> :
                     service.name.toLowerCase().includes('agent') ? <Bot className="h-3 w-3 text-muted-foreground" /> :
                     <Activity className="h-3 w-3 text-muted-foreground" />}
                    <span className="text-[11px] font-bold text-muted-foreground">{service.name}</span>
                  </div>
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500 shadow-[0_0_4px_rgba(34,197,94,0.6)]" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Acquisition Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 bg-primary rounded-full" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Acquisition</h3>
              <span className="text-[11px] text-muted-foreground">Messages, contacts & reach (last 30 days)</span>
            </div>
            <div className="flex items-center p-1 rounded-lg bg-muted/50 border">
              <Button variant="ghost" size="sm" className="h-7 text-[10px] px-2 font-bold text-muted-foreground">Last 7 days</Button>
              <Button variant="secondary" size="sm" className="h-7 text-[10px] px-3 font-bold bg-white shadow-sm">Last 30 days</Button>
              <Button variant="ghost" size="sm" className="h-7 text-[10px] px-2 font-bold text-muted-foreground">Last 90 days</Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.map((stat) => (
              <Card key={stat.label} className="border-none shadow-sm bg-white hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2 rounded-lg bg-primary/5 text-primary">
                      <stat.icon className="h-5 w-5" />
                    </div>
                    <div className={cn(
                      "flex items-center gap-0.5 text-[11px] font-bold",
                      stat.up ? "text-green-500" : "text-red-500"
                    )}>
                      <TrendingUp className="h-3 w-3" />
                      {stat.trend}
                    </div>
                  </div>
                  <h3 className="text-4xl font-bold tracking-tight mb-1">{stat.value}</h3>
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </CRMLayout>
  )
}
