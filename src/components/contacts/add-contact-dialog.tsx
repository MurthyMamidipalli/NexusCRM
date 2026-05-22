
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
import { Loader2, Building2, User, Phone, Mail } from 'lucide-react'

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
      phone: formData.get('phone'),
      company: formData.get('company'),
      industry: formData.get('industry'),
      since: new Date().getFullYear().toString(),
      ownerId: user.uid,
    }

    // Optimistic UI update
    onOpenChange(false)
    
    createRecord(db, collections.CUSTOMERS, data)
      .then(() => {
        toast({ title: 'Contact Created', description: `${data.name} has been added to your network.` })
      })
      .catch((error: any) => {
        toast({ variant: 'destructive', title: 'Error', description: error.message })
      })
      .finally(() => {
        setLoading(false)
      })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] bg-[#121214] text-white border-none rounded-2xl p-8">
        <DialogHeader className="mb-6">
          <DialogTitle className="font-headline text-3xl font-bold">Add Manual Contact</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-semibold text-white">Full Name</Label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                id="name" 
                name="name" 
                className="bg-[#1c1c1f] border-none text-white h-12 pl-12 focus:ring-1 focus:ring-primary rounded-xl" 
                placeholder="Jane Cooper" 
                required 
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-semibold text-white">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                id="email" 
                name="email" 
                type="email" 
                className="bg-[#1c1c1f] border-none text-white h-12 pl-12 focus:ring-1 focus:ring-primary rounded-xl" 
                placeholder="jane@example.com" 
                required 
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-semibold text-white">Contact Number</Label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                id="phone" 
                name="phone" 
                className="bg-[#1c1c1f] border-none text-white h-12 pl-12 focus:ring-1 focus:ring-primary rounded-xl" 
                placeholder="+1 (555) 000-0000" 
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="company" className="text-sm font-semibold text-white">Company</Label>
            <div className="relative">
              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                id="company" 
                name="company" 
                className="bg-[#1c1c1f] border-none text-white h-12 pl-12 focus:ring-1 focus:ring-primary rounded-xl" 
                placeholder="Company Name" 
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="industry" className="text-sm font-semibold text-white">Relationship / Category</Label>
            <Select name="industry" defaultValue="Client">
              <SelectTrigger className="bg-[#1c1c1f] border-none text-white h-12 px-4 focus:ring-1 focus:ring-primary rounded-xl">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent className="bg-[#1c1c1f] border-gray-800 text-white">
                <SelectItem value="Client">Client</SelectItem>
                <SelectItem value="Partner">Partner</SelectItem>
                <SelectItem value="Vendor">Vendor</SelectItem>
                <SelectItem value="Referral">Referral</SelectItem>
                <SelectItem value="Personal">Personal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="pt-4 gap-3">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => onOpenChange(false)}
              className="bg-[#1c1c1f] hover:bg-gray-800 text-white font-bold h-12 px-8 rounded-xl border-none"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading} 
              className="bg-primary hover:bg-primary/90 text-white font-bold h-12 px-8 rounded-xl border-none shadow-lg shadow-primary/20"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Contact
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
