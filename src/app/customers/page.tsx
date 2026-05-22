
"use client"

import React, { useMemo, useState, useEffect } from 'react'
import { CRMLayout } from '@/components/layout/crm-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Search, Filter, Download, UserCheck, Loader2, Building2, Mail, Phone } from 'lucide-react'
import { useFirestore, useCollection, useUser } from '@/firebase'
import { collection, query, orderBy, where } from 'firebase/firestore'
import { collections } from '@/lib/firestore-service'
import { Input } from '@/components/ui/input'
import { AddContactDialog } from '@/components/contacts/add-contact-dialog'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'

export default function ContactsPage() {
  const db = useFirestore()
  const { user } = useUser()
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedContact, setSelectedContact] = useState<any>(null)
  const [mounted, setMounted] = useState(false)
  
  const contactsQuery = useMemo(() => {
    if (!db || !user) return null
    return query(
      collection(db, collections.CONTACTS), 
      where('ownerId', '==', user.uid),
      orderBy('createdAt', 'desc')
    )
  }, [db, user])
  
  const { data: contacts, loading } = useCollection(contactsQuery)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <CRMLayout>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-headline text-4xl font-bold tracking-tight text-foreground">Contact Hub</h1>
          <p className="text-muted-foreground">Manage your relationships and professional network manually.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2 border-border/50 bg-card hover:bg-muted">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-white border-none">
            <UserCheck className="h-4 w-4" />
            Add Contact
          </Button>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-10 bg-card/50 border-border/50 focus:ring-primary/50" placeholder="Search contacts..." />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" /> Filter
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : contacts && contacts.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {contacts.map((contact: any) => (
            <Card key={contact.id} className="group border-none bg-card/50 backdrop-blur-md shadow-lg hover:shadow-2xl transition-all duration-300">
              <CardContent className="text-center p-6">
                <div className="flex flex-col items-center justify-center py-6">
                  <h3 className="font-headline text-xl font-bold group-hover:text-primary transition-colors mb-6">{contact.name}</h3>
                  
                  <Button 
                    variant="ghost" 
                    className="w-full text-primary group-hover:bg-primary group-hover:text-white transition-all border border-primary/20 group-hover:border-transparent"
                    onClick={() => setSelectedContact(contact)}
                  >
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border/50 bg-card/30">
          <UserCheck className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">No contacts found. Add your first contact manually!</p>
        </div>
      )}

      <AddContactDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} />

      {/* View Contact Dialog */}
      <Dialog open={!!selectedContact} onOpenChange={(open) => !open && setSelectedContact(null)}>
        <DialogContent className="sm:max-w-[450px] bg-[#121214] text-white border-none rounded-2xl p-0 overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>{selectedContact?.name || 'Contact Profile'}</DialogTitle>
            <DialogDescription>Detailed professional information for {selectedContact?.name}</DialogDescription>
          </DialogHeader>
          <div className="h-32 bg-gradient-to-r from-primary/20 to-accent/20" />
          <div className="px-8 pb-8 -mt-12 space-y-6">
            <div className="flex flex-col items-center text-center space-y-2 pt-16">
              <div className="space-y-1">
                <h2 className="text-3xl font-bold font-headline">{selectedContact?.name}</h2>
                <p className="text-primary font-semibold">
                  {selectedContact?.company || 'Private Professional'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-[#1c1c1f]">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Mail className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Email Address</span>
                  <span className="text-sm font-medium">{selectedContact?.email}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-xl bg-[#1c1c1f]">
                <div className="p-2 rounded-lg bg-accent/10 text-accent">
                  <Phone className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Contact Number</span>
                  <span className="text-sm font-medium">{selectedContact?.phone || 'Not Provided'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-[#1c1c1f]">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Relationship</span>
                    <span className="text-sm font-bold text-primary">{selectedContact?.industry || 'Professional'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-xl bg-[#1c1c1f]">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Year Joined</span>
                    <span className="text-sm font-bold">{selectedContact?.since || '2024'}</span>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button 
                onClick={() => setSelectedContact(null)}
                className="w-full bg-[#1c1c1f] hover:bg-gray-800 text-white font-bold h-12 rounded-xl"
              >
                Close Profile
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </CRMLayout>
  )
}
