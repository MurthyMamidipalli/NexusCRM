
"use client"

import React, { useMemo, useState, useEffect } from 'react'
import { CRMLayout } from '@/components/layout/crm-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { 
  Building2, 
  Briefcase, 
  Loader2, 
  Calendar, 
  Clock, 
  Users, 
  Laptop,
  Pencil,
  Plus,
  Trash2
} from 'lucide-react'
import { useUser, useFirestore, useDoc } from '@/firebase'
import { doc } from 'firebase/firestore'
import { collections } from '@/lib/firestore-service'
import { usePersistentDocument } from '@/hooks/use-persistence'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription,
  DialogTrigger
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from '@/hooks/use-toast'

const EMPTY_CAREER = {};

export default function CareerPage() {
  const { user } = useUser()
  const db = useFirestore()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const profileRef = useMemo(() => user ? doc(db, collections.PROFILES, user.uid) : null, [db, user])
  const { data: profileDoc, loading: profileLoading } = useDoc(profileRef)

  const initialData = useMemo(() => profileDoc || EMPTY_CAREER, [profileDoc]);

  const { data: profile, updateField, save } = usePersistentDocument(
    collections.PROFILES,
    user?.uid,
    initialData
  )

  const currentJob = (profile as any)?.currentJob || {}

  const handleSaveJob = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    const updatedJob = {
      company: formData.get('company') as string,
      title: formData.get('title') as string,
      startDate: formData.get('startDate') as string,
      endDate: formData.get('endDate') as string,
      employmentType: formData.get('employmentType') as string,
      workSetting: formData.get('workSetting') as string,
    }

    updateField('currentJob' as any, updatedJob)
    // We explicitly wait for the state to be updated by using updatedJob if needed,
    // but our new hook ref-based logic handles this.
    save()
    setIsDialogOpen(false)
    toast({ title: 'Professional Position Updated' })
  }

  const removeJob = () => {
    updateField('currentJob' as any, null)
    save()
    toast({ title: 'Position Removed' })
  }

  if (!mounted || profileLoading) {
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
          <h1 className="font-headline text-4xl font-bold tracking-tight">🏢 Current Job</h1>
          <p className="text-muted-foreground">Manage your current professional standing and role details.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-lg shadow-primary/20 bg-[#7299f0] hover:bg-[#6387d9] text-white">
              {currentJob.company ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {currentJob.company ? 'Edit Job Role' : 'Add Job Role'}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] bg-[#121214] text-white border-none rounded-2xl p-8">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl font-bold font-headline">Add Job Role</DialogTitle>
              <DialogDescription className="text-gray-400">
                Enter details about your professional position.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSaveJob} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="company" className="text-sm font-semibold text-white">Company Name</Label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                      id="company" 
                      name="company" 
                      defaultValue={currentJob.company || ''}
                      placeholder="e.g. Acme Corp" 
                      className="bg-[#1c1c1f] border-none text-white h-12 pl-12 focus:ring-1 focus:ring-primary rounded-xl"
                      required 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-semibold text-white">Your Role / Title</Label>
                  <div className="relative">
                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                      id="title" 
                      name="title" 
                      defaultValue={currentJob.title || ''}
                      placeholder="e.g. Senior Software Engineer" 
                      className="bg-[#1c1c1f] border-none text-white h-12 pl-12 focus:ring-1 focus:ring-primary rounded-xl"
                      required 
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="startDate" className="text-sm font-semibold text-white">Joining Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                      id="startDate" 
                      name="startDate" 
                      type="date"
                      defaultValue={currentJob.startDate || ''}
                      className="bg-[#1c1c1f] border-none text-white h-12 pl-12 focus:ring-1 focus:ring-primary rounded-xl [color-scheme:dark]"
                      required 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate" className="text-sm font-semibold text-white">End Date (Optional)</Label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                      id="endDate" 
                      name="endDate" 
                      type="date"
                      defaultValue={currentJob.endDate || ''}
                      className="bg-[#1c1c1f] border-none text-white h-12 pl-12 focus:ring-1 focus:ring-primary rounded-xl [color-scheme:dark]"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-white">Employment Type</Label>
                  <div className="relative">
                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
                    <Select name="employmentType" defaultValue={currentJob.employmentType || "Full-time"}>
                      <SelectTrigger className="bg-[#1c1c1f] border-none text-white h-12 pl-12 focus:ring-1 focus:ring-primary rounded-xl">
                        <SelectValue placeholder="Full-time" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1c1c1f] border-gray-800 text-white">
                        <SelectItem value="Full-time">Full-time</SelectItem>
                        <SelectItem value="Part-time">Part-time</SelectItem>
                        <SelectItem value="Contract">Contract</SelectItem>
                        <SelectItem value="Freelance">Freelance</SelectItem>
                        <SelectItem value="Internship">Internship</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-white">Work Setting</Label>
                  <div className="relative">
                    <Laptop className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
                    <Select name="workSetting" defaultValue={currentJob.workSetting || "Remote"}>
                      <SelectTrigger className="bg-[#1c1c1f] border-none text-white h-12 pl-12 focus:ring-1 focus:ring-primary rounded-xl">
                        <SelectValue placeholder="Remote" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1c1c1f] border-gray-800 text-white">
                        <SelectItem value="Remote">Remote</SelectItem>
                        <SelectItem value="Hybrid">Hybrid</SelectItem>
                        <SelectItem value="On-site">On-site</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <DialogFooter className="pt-4 gap-3">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setIsDialogOpen(false)}
                  className="bg-[#1c1c1f] hover:bg-gray-800 text-white font-bold h-12 px-8 rounded-xl border-none"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-[#7299f0] hover:bg-[#6387d9] text-white font-bold h-12 px-8 rounded-xl border-none"
                >
                  {currentJob.company ? 'Save Changes' : 'Add Job'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="max-w-4xl">
        {currentJob.company ? (
          <Card className="border-none bg-card/50 backdrop-blur-md shadow-xl group overflow-hidden">
            <div className="h-24 bg-gradient-to-r from-[#7299f0]/20 to-accent/10" />
            <CardContent className="p-8 relative">
              <div className="flex flex-col md:flex-row items-start justify-between gap-6">
                <div className="flex gap-6">
                  <div className="p-5 rounded-2xl bg-primary/10 text-primary h-fit">
                    <Building2 className="h-8 w-8" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-3xl font-bold font-headline">{currentJob.title}</h2>
                    <p className="text-xl text-primary font-bold">{currentJob.company}</p>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground pt-2">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" />
                        {currentJob.startDate} — {currentJob.endDate || 'Present'}
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/50 text-[10px] font-bold uppercase tracking-widest">
                        <Users className="h-3 w-3" /> {currentJob.employmentType || 'Full-time'}
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/50 text-[10px] font-bold uppercase tracking-widest">
                        <Laptop className="h-3 w-3" /> {currentJob.workSetting || 'Remote'}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={() => setIsDialogOpen(true)} className="rounded-xl">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={removeJob} className="rounded-xl text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-border/50 bg-card/30 text-muted-foreground italic">
            <div className="p-4 rounded-full bg-muted/20 mb-4">
              <Briefcase className="h-8 w-8 opacity-20" />
            </div>
            No active job recorded. Click "Add Job Role" to set your current position.
          </div>
        )}
      </div>
    </CRMLayout>
  )
}
