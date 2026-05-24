"use client"

import React, { useMemo, useState, useEffect } from 'react'
import { CRMLayout } from '@/components/layout/crm-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Quote, Loader2, Trash2, User, Pencil, X } from 'lucide-react'
import { useFirestore, useCollection, useUser } from '@/firebase'
import { collection, query, where } from 'firebase/firestore'
import { collections, deleteRecord, createRecord, updateRecord } from '@/lib/firestore-service'
import { toast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription, DialogClose } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { errorEmitter } from '@/firebase/error-emitter'
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors'

export default function TestimonialsPage() {
  const db = useFirestore()
  const { user } = useUser()
  const [mounted, setMounted] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTest, setEditingTest] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testQuery = useMemo(() => {
    if (!db || !user) return null
    return query(
      collection(db, collections.TESTIMONIALS), 
      where('ownerId', '==', user.uid)
    )
  }, [db, user])

  const { data: rawTestimonials, loading: testLoading } = useCollection(testQuery)

  // In-memory sorting for index resilience
  const testimonials = useMemo(() => {
    if (!rawTestimonials) return []
    return [...rawTestimonials].sort((a: any, b: any) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    })
  }, [rawTestimonials])

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSaveTest = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user || !db) return

    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const data = {
      author: formData.get('author') as string,
      role: formData.get('role') as string,
      company: formData.get('company') as string,
      content: formData.get('content') as string,
      date: editingTest?.date || new Date().toISOString().split('T')[0],
    }

    const mutation = editingTest 
      ? updateRecord(db, collections.TESTIMONIALS, editingTest.id, data)
      : createRecord(db, collections.TESTIMONIALS, data, user.uid)

    mutation.catch(async (err) => {
      const permissionError = new FirestorePermissionError({
        path: editingTest ? `${collections.TESTIMONIALS}/${editingTest.id}` : collections.TESTIMONIALS,
        operation: editingTest ? 'update' : 'create',
        requestResourceData: data,
      } satisfies SecurityRuleContext);
      errorEmitter.emit('permission-error', permissionError);
    })

    toast({ title: editingTest ? 'Endorsement Updated' : 'Endorsement Added' })
    setIsDialogOpen(false)
    setEditingTest(null)
    setLoading(false)
  }

  const handleDelete = (id: string) => {
    if (!db) return
    deleteRecord(db, collections.TESTIMONIALS, id)
      .catch(async (err) => {
        const permissionError = new FirestorePermissionError({
          path: `${collections.TESTIMONIALS}/${id}`,
          operation: 'delete',
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      })
    toast({ title: 'Testimonial Removed' })
  }

  if (!mounted || testLoading) {
    return (
      <CRMLayout>
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </CRMLayout>
    )
  }

  return (
    <CRMLayout>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-headline text-4xl font-bold tracking-tight">🌟 Testimonials</h1>
          <p className="text-muted-foreground">What your peers and managers say about your work.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingTest(null);
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-lg shadow-primary/20" onClick={() => setEditingTest(null)}>
              <Plus className="h-4 w-4" />
              Add Testimonial
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px] bg-[#121214] text-white border-none rounded-3xl p-0 overflow-hidden flex flex-col max-h-[90vh]">
            <DialogHeader className="p-8 pb-4 border-b border-white/5 relative shrink-0 text-left">
              <DialogTitle className="text-3xl font-bold font-headline text-white">{editingTest ? 'Edit Endorsement' : 'Add New Endorsement'}</DialogTitle>
              <DialogDescription className="text-gray-400">Share professional feedback from your network.</DialogDescription>
              <DialogClose className="absolute right-4 top-4 text-gray-500 hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </DialogClose>
            </DialogHeader>

            <form onSubmit={handleSaveTest} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="author" className="text-sm font-semibold text-white">Author Name</Label>
                  <Input id="author" name="author" defaultValue={editingTest?.author || ''} placeholder="Jane Cooper" required className="bg-[#1c1c1f] border-none text-white h-14 rounded-2xl focus:ring-1 focus:ring-primary px-4" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-sm font-semibold text-white">Role</Label>
                    <Input id="role" name="role" defaultValue={editingTest?.role || ''} placeholder="CTO" required className="bg-[#1c1c1f] border-none text-white h-14 rounded-2xl focus:ring-1 focus:ring-primary px-4" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company" className="text-sm font-semibold text-white">Company</Label>
                    <Input id="company" name="company" defaultValue={editingTest?.company || ''} placeholder="Acme Inc." required className="bg-[#1c1c1f] border-none text-white h-14 rounded-2xl focus:ring-1 focus:ring-primary px-4" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content" className="text-sm font-semibold text-white">Testimonial Content</Label>
                  <Textarea id="content" name="content" defaultValue={editingTest?.content || ''} placeholder="Share the specific feedback received..." className="bg-[#1c1c1f] border-none min-h-[150px] rounded-2xl focus:ring-1 focus:ring-primary" required />
                </div>
              </div>
              <DialogFooter className="p-8 pt-4 border-t border-white/5 bg-[#121214] shrink-0">
                <Button type="submit" disabled={loading} className="w-full bg-[#10b981] hover:bg-[#0da372] text-white font-bold h-14 rounded-2xl shadow-lg shadow-emerald-500/20 text-lg">
                  {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                  Save Endorsement
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {testimonials && testimonials.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {testimonials.map((test: any) => (
            <Card key={test.id} className="border-none bg-card/50 backdrop-blur-md shadow-md group">
              <CardContent className="p-6">
                <Quote className="h-8 w-8 text-primary/20 mb-4" />
                <p className="text-sm italic leading-relaxed text-foreground mb-6">
                  "{test.content}"
                </p>
                <div className="flex items-center justify-between border-t border-border/50 pt-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border border-primary/10">
                      <AvatarImage src={`https://picsum.photos/seed/${test.author}/40/40`} />
                      <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold">{test.author}</span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                        {test.role} @ {test.company}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-muted-foreground hover:text-primary" 
                      onClick={() => {
                        setEditingTest(test);
                        setIsDialogOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-muted-foreground hover:text-destructive" 
                      onClick={() => handleDelete(test.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border/50 bg-card/30 text-muted-foreground italic">
          No testimonials recorded yet.
        </div>
      )}
    </CRMLayout>
  )
}
