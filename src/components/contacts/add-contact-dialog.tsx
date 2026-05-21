
"use client"

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useFirestore, useUser } from '@/firebase'
import { createRecord, collections } from '@/lib/firestore-service'
import { toast } from '@/hooks/use-toast'
import { Loader2, Building2, User } from 'lucide-react'

interface AddContactDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddContactDialog({ open, onOpenChange }: AddContactDialogProps) {
  const [loading, setLoading] = useState(false)
  const db = useFirestore()
  const { user } = useUser()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      company: formData.get('company'),
      industry: formData.get('industry'),
      since: new Date().getFullYear().toString(),
      ownerId: user.uid,
    }

    try {
      await createRecord(db, collections.CUSTOMERS, data)
      toast({ title: 'Contact Created', description: `${data.name} has been added to your network.` })
      onOpenChange(false)
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">Add Manual Contact</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="name" name="name" className="pl-10" placeholder="Jane Cooper" required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" name="email" type="email" placeholder="jane@example.com" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company">Company</Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="company" name="company" className="pl-10" placeholder="Company Name" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="industry">Relationship / Category</Label>
            <Select name="industry" defaultValue="Client">
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Client">Client</SelectItem>
                <SelectItem value="Partner">Partner</SelectItem>
                <SelectItem value="Vendor">Vendor</SelectItem>
                <SelectItem value="Referral">Referral</SelectItem>
                <SelectItem value="Personal">Personal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading} className="shadow-lg shadow-primary/20">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Contact
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
