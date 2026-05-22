
"use client"

import React, { useMemo, useState, useEffect } from 'react'
import { CRMLayout } from '@/components/layout/crm-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Search, Filter, Download, UserCheck, Loader2, Building2, Mail, Phone, Trash2, Pencil } from 'lucide-react'
import { useFirestore, useCollection, useUser } from '@/firebase'
import { collection, query, orderBy, where } from 'firebase/firestore'
import { collections, deleteRecord } from '@/lib/firestore-service'
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
import { toast } from '@/hooks/use-toast'
import { errorEmitter } from '@/firebase/error-emitter'
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors'

export default function ContactsPage() {
  const db = useFirestore()
  const { user } = useUser()
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedContact, setSelectedContact] = useState<any>(null)
  const [editingContact, setEditingContact] = useState<any>(null)
  const [mounted, setMounted] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  
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

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!db) return
    
    deleteRecord(db, collections.CONTACTS, id)
      .catch(async (err) => {
        const permissionError = new FirestorePermissionError({
          path: `${collections.CONTACTS}/${id}`,
          operation: 'delete',
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      })
    toast({ title: 'Contact Removed', description: 'The record has been deleted from your network.' })
  }

  const handleEdit = (contact: any, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingContact(contact)
    setIsAddDialogOpen(true)
  }

  const filteredContacts = useMemo(() => {
    if (!contacts) return []
    return contacts.filter((c: any) => 
      c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.company?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [contacts, searchQuery])

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
          <Button onClick={() => { setEditingContact(null); setIsAddDialogOpen(true); }} className="gap-2 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-white border-none">
            <UserCheck className="h-4 w-4" />
            Add Contact
          </Button>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            className="pl-10 bg-card/50 border-border/50 focus:ring-primary/50" 
            placeholder="Search contacts..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
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
      ) : filteredContacts && filteredContacts.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {filteredContacts.map((contact: any) => (
            <Card key={contact.id} className="group relative border-none bg-card/50 backdrop-blur-md shadow-lg hover:shadow-2xl transition-all duration-300">
              <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={(e) => handleEdit(contact, e)}
                  className="p-2 text-muted-foreground hover:text-primary"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button 
                  onClick={(e) => handleDelete(contact.id, e)}
                  className="p-2 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <CardContent className="text-center p-6 pt-10">
                <div className="flex flex-col items-center justify-center">
                  <h3 className="font-headline text-xl font-bold group-hover:text-primary transition-colors mb-2">{contact.name}</h3>
                  <p className="text-xs text-muted-foreground mb-6 line-clamp-1">{contact.company || 'Private Professional'}</p>
                  
                  <Button 
                    variant="ghost" 
                    className="w-full text-primary group-hover:bg-primary group-hover:text-white transition-all border border-primary/20 group-hover:border-transparent rounded-xl"
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

      <AddContactDialog 
        open={isAddDialogOpen} 
        onOpenChange={(open) => {
          setIsAddDialogOpen(open)
          if (!open) setEditingContact(null)
        }} 
        contact={editingContact}
      />

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
