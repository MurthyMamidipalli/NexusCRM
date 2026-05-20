
"use client"

import React, { useMemo } from 'react'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, Mail, Phone, Trash2, Loader2, Briefcase, ExternalLink } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { useFirestore, useCollection } from '@/firebase'
import { collection, query, orderBy } from 'firebase/firestore'
import { collections, deleteRecord } from '@/lib/firestore-service'
import { toast } from '@/hooks/use-toast'

export function LeadTable() {
  const db = useFirestore()
  const leadsQuery = useMemo(() => query(collection(db, collections.LEADS), orderBy('createdAt', 'desc')), [db])
  const { data: leads, loading } = useCollection(leadsQuery)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New': return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
      case 'Contacted': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
      case 'Qualified': return 'bg-purple-500/10 text-purple-500 border-purple-500/20'
      case 'Proposal Sent': return 'bg-orange-500/10 text-orange-500 border-orange-500/20'
      case 'Negotiation': return 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20'
      case 'Won': return 'bg-green-500/10 text-green-500 border-green-500/20'
      default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'text-red-500'
      case 'Medium': return 'text-yellow-500'
      case 'Low': return 'text-green-500'
      default: return 'text-slate-500'
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteRecord(db, collections.LEADS, id)
      toast({ title: 'Lead Deleted' })
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message })
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!leads || leads.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border/50 bg-card/30">
        <p className="text-muted-foreground">No leads found. Start by adding a new intelligence lead.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border/50 bg-card/50 shadow-xl overflow-hidden backdrop-blur-md">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="w-[300px]">Lead / Role</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Value</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead: any) => (
            <TableRow key={lead.id} className="hover:bg-muted/30 transition-colors">
              <TableCell className="font-medium">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border border-primary/10">
                    <AvatarImage src={`https://picsum.photos/seed/${lead.name}/40/40`} />
                    <AvatarFallback>{lead.name?.[0] || 'L'}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-foreground font-bold">{lead.name}</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Briefcase className="h-3 w-3" />
                      {lead.jobTitle || 'No Title'}
                    </span>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground font-semibold">{lead.company || '-'}</TableCell>
              <TableCell>
                <Badge variant="outline" className={cn("text-[10px] uppercase tracking-tighter", getStatusColor(lead.status))}>
                  {lead.status}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5">
                  <div className={cn("h-1.5 w-1.5 rounded-full", getPriorityColor(lead.priority).replace('text', 'bg'))} />
                  <span className={cn("text-[10px] font-bold uppercase tracking-wider", getPriorityColor(lead.priority))}>
                    {lead.priority}
                  </span>
                </div>
              </TableCell>
              <TableCell className="font-mono text-sm">
                ${(lead.value || 0).toLocaleString()}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem className="gap-2">
                      <Mail className="h-4 w-4" /> Send Email
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2">
                      <Phone className="h-4 w-4" /> Call Lead
                    </DropdownMenuItem>
                    {lead.links && (
                      <DropdownMenuItem className="gap-2" onClick={() => {
                        const firstLink = lead.links.split(',')[0].trim();
                        if (firstLink) window.open(firstLink.startsWith('http') ? firstLink : `https://${firstLink}`, '_blank');
                      }}>
                        <ExternalLink className="h-4 w-4" /> View Profile
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem className="text-destructive gap-2" onClick={() => handleDelete(lead.id)}>
                      <Trash2 className="h-4 w-4" /> Delete Lead
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
