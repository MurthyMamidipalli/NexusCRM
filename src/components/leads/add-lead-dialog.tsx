
"use client"

import React, { useState, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useFirestore, useUser, useDoc } from '@/firebase'
import { createRecord, collections, deleteRecord } from '@/lib/firestore-service'
import { toast } from '@/hooks/use-toast'
import { Loader2, Briefcase, GraduationCap, Link as LinkIcon } from 'lucide-react'
import { usePersistentDocument } from '@/hooks/use-persistence'
import { doc } from 'firebase/firestore'

interface AddLeadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const DEFAULT_LEAD = {
  name: '',
  email: '',
  phone: '',
  company: '',
  jobTitle: '',
  education: '',
  experience: '',
  links: '',
  status: 'New',
  priority: 'Medium',
  value: 0,
  source: 'Direct',
  notes: '',
  tags: ''
}

export function AddLeadDialog({ open, onOpenChange }: AddLeadDialogProps) {
  const [loading, setLoading] = useState(false)
  const db = useFirestore()
  const { user } = useUser()

  // Draft persistence
  const draftId = `lead-draft-${user?.uid}`
  const draftRef = useMemo(() => user ? doc(db, 'drafts', draftId) : null, [db, user, draftId])
  const { data: existingDraft } = useDoc(draftRef)

  const { data: draft, updateField, setLocalData } = usePersistentDocument(
    'drafts',
    draftId,
    existingDraft || DEFAULT_LEAD
  )

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    const data = {
      ...draft,
      value: parseFloat(draft.value?.toString() || '0'),
      tags: draft.tags?.split(',').map((t: string) => t.trim()).filter((t: string) => t) || [],
      ownerId: user.uid,
      ownerName: user.displayName || user.email,
    }

    try {
      await createRecord(db, collections.LEADS, data)
      toast({ title: 'Lead Created', description: `${data.name} has been added to your intelligence.` })
      
      // Clear draft after successful creation
      await deleteRecord(db, 'drafts', draftId)
      setLocalData(DEFAULT_LEAD)
      onOpenChange(false)
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Persistence Error', description: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">Add Intelligence Lead</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input 
                id="name" 
                value={draft.name || ''} 
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="John Smith" 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                value={draft.email || ''}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="john@company.com" 
                required 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input 
                id="company" 
                value={draft.company || ''}
                onChange={(e) => updateField('company', e.target.value)}
                placeholder="e.g. Acme Corp" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jobTitle">Job Title</Label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="jobTitle" 
                  className="pl-10" 
                  value={draft.jobTitle || ''}
                  onChange={(e) => updateField('jobTitle', e.target.value)}
                  placeholder="e.g. Senior Director" 
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Persistent Internal Notes</Label>
            <Textarea 
              id="notes" 
              className="min-h-[80px]" 
              value={draft.notes || ''}
              onChange={(e) => updateField('notes', e.target.value)}
              placeholder="Auto-saved draft content..." 
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading} className="shadow-lg shadow-primary/20">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Lead
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
