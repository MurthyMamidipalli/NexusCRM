"use client"

import React, { useMemo, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useFirestore, useDoc, useCollection } from '@/firebase'
import { doc, collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore'
import { collections } from '@/lib/firestore-service'
import { Loader2, User, Mail, MapPin, Globe, Briefcase, Rocket, Lock, ShieldAlert } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export default function PublicProfilePage() {
  const params = useParams()
  const uid = params.uid as string
  const db = useFirestore()
  const [fallbackProfile, setFallbackProfile] = useState<any>(null)
  const [searchingFallback, setSearchingFallback] = useState(false)
  const [listingFinished, setListingFinished] = useState(false)

  // Primary Query: Direct Doc Reference (Fastest)
  const profileRef = useMemo(() => uid && db ? doc(db, collections.PROFILES, uid) : null, [db, uid])
  const { data: profileDoc, loading: profileLoading, error: profileError } = useDoc(profileRef)

  // Sub-resource Queries
  const skillsQuery = useMemo(() => uid && db ? query(collection(db, collections.SKILLS), where('ownerId', '==', uid), orderBy('name', 'asc')) : null, [db, uid])
  const expQuery = useMemo(() => uid && db ? query(collection(db, collections.EXPERIENCE), where('ownerId', '==', uid), orderBy('startDate', 'desc')) : null, [db, uid])
  const projectsQuery = useMemo(() => uid && db ? query(collection(db, collections.PROJECTS), where('ownerId', '==', uid), orderBy('updatedAt', 'desc')) : null, [db, uid])

  const { data: skills } = useCollection(skillsQuery)
  const { data: experience } = useCollection(expQuery)
  const { data: projects } = useCollection(projectsQuery)

  // Intensive Database Listing Diagnostic
  useEffect(() => {
    async function runDatabaseDiagnostic() {
      if (!db || !uid) return;
      
      console.group('🚀 [SYSTEM DIAGNOSTIC] Profiles Intelligence');
      console.log('Target Profile UID (from URL):', uid);
      
      try {
        // 1. Attempt to list the collection to see if ANY public profiles exist
        const qAll = query(collection(db, collections.PROFILES));
        const snapshot = await getDocs(qAll);
        
        if (snapshot.empty) {
          console.warn('❌ profiles collection is empty (or no public profiles exist)');
        } else {
          console.log(`✅ Found ${snapshot.size} public documents in "profiles" collection:`);
          snapshot.docs.forEach((d) => {
            const data = d.data();
            console.log(`- Document ID: ${d.id}`, {
              ownerId: data.ownerId,
              isPublic: data.isPublic,
              firstName: data.firstName,
              lastName: data.lastName,
              isMatch: d.id === uid || data.ownerId === uid
            });
          });
        }

        // 2. Perform targeted ownerId lookup if direct ID failed
        if (!profileDoc && !profileLoading) {
          setSearchingFallback(true);
          const q = query(collection(db, collections.PROFILES), where('ownerId', '==', uid), limit(1));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            const found = querySnapshot.docs[0].data();
            console.log('🎯 Fallback Success: Found profile via ownerId field:', found);
            setFallbackProfile({ ...found, id: querySnapshot.docs[0].id });
          } else {
            console.error('❌ No document matches this UID as either an ID or ownerId.');
          }
        }
      } catch (err: any) {
        console.error('🛑 Diagnostic Error:', err.message);
        if (err.message.includes('permission-denied')) {
          console.error('SECURITY ALERT: Firestore rules are blocking access. Ensure isPublic is true.');
        }
      } finally {
        setListingFinished(true);
        console.groupEnd();
      }
    }
    
    runDatabaseDiagnostic();
  }, [uid, db, profileDoc, profileLoading]);

  const activeProfile = profileDoc || fallbackProfile
  const isVisible = activeProfile && activeProfile.isPublic === true
  const isPrivate = activeProfile && !isVisible
  const isPermissionDenied = !!profileError

  // Only show loader if we are actually waiting on a query
  if (profileLoading || (searchingFallback && !activeProfile && !listingFinished)) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-[#0a0a0c]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-4 text-xs text-muted-foreground uppercase tracking-widest font-bold animate-pulse">
          Authenticating Intelligence...
        </p>
      </div>
    )
  }

  // Handle various states of "Not Visible"
  if (isPrivate || isPermissionDenied || !activeProfile) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-[#0a0a0c] text-white p-6 text-center">
        <div className="p-6 rounded-full bg-muted/10 mb-6">
          {isPermissionDenied ? (
            <ShieldAlert className="h-12 w-12 text-yellow-500" />
          ) : (
            <Lock className="h-12 w-12 text-muted-foreground" />
          )}
        </div>
        <h1 className="text-4xl font-bold font-headline mb-4">
          {isPermissionDenied ? 'Access Restricted' : 'Private Portfolio'}
        </h1>
        <p className="text-muted-foreground max-w-md text-lg leading-relaxed">
          {isPermissionDenied 
            ? "Database security rules are preventing unauthenticated access to this hub. Check isPublic field in settings."
            : "This professional hub is currently private. Enable 'Public Profile Access' in your dashboard to share it."}
        </p>
        <div className="mt-8 flex gap-4">
          <Button variant="outline" className="border-white/10 text-white h-12 px-8 rounded-xl font-bold" asChild>
            <a href="/login">Manage Your Hub</a>
          </Button>
        </div>
      </div>
    )
  }

  const displayFirstName = activeProfile.firstName || '';
  const displayLastName = activeProfile.lastName || '';
  const displayFullName = displayFirstName || displayLastName 
    ? `${displayFirstName} ${displayLastName}`.trim()
    : activeProfile.fullName || 'Professional User';

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white selection:bg-primary/30 pb-20">
      <div className="h-64 bg-gradient-to-br from-primary/20 via-accent/10 to-background border-b border-white/5" />
      
      <div className="container mx-auto px-4 md:px-6 max-w-5xl">
        <div className="flex flex-col md:flex-row items-end gap-8 -mt-20">
          <Avatar className="h-40 w-40 border-8 border-[#0a0a0c] shadow-2xl rounded-[2.5rem]">
            <AvatarImage src={activeProfile.avatarUrl || `https://picsum.photos/seed/${uid}/200/200`} />
            <AvatarFallback className="bg-muted text-5xl">
              <User className="h-16 w-16 text-muted-foreground" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2 mb-2 text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-bold font-headline tracking-tight">{displayFullName}</h1>
            <p className="text-xl text-primary font-semibold">{activeProfile.tagline || 'Talent Intelligence'}</p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-4 text-sm text-muted-foreground font-medium uppercase tracking-widest">
              {activeProfile.location && (
                <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {activeProfile.location}</span>
              )}
              {activeProfile.email && (
                <span className="flex items-center gap-1.5 lowercase italic"><Mail className="h-4 w-4" /> {activeProfile.email.toLowerCase()}</span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mt-16">
          <div className="space-y-12 lg:col-span-1">
            <section className="space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground border-b border-white/5 pb-2">About</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {activeProfile.bio || "Professional background summary not provided."}
              </p>
            </section>

            <section className="space-y-6">
              <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground border-b border-white/5 pb-2">Competencies</h2>
              <div className="flex flex-wrap gap-2">
                {skills && skills.length > 0 ? (
                  skills.map((skill: any) => (
                    <Badge key={skill.id} variant="outline" className="bg-white/5 border-white/10 py-1.5 px-3 text-[11px] uppercase tracking-widest font-bold">
                      {skill.name}
                    </Badge>
                  ))
                ) : (
                  <p className="text-xs italic text-muted-foreground">Expertise mapping pending.</p>
                )}
              </div>
            </section>
          </div>

          <div className="lg:col-span-2 space-y-16">
            <section className="space-y-8">
              <div className="flex items-center gap-3 text-primary">
                <Briefcase className="h-5 w-5" />
                <h2 className="text-2xl font-bold font-headline">Professional Journey</h2>
              </div>
              <div className="space-y-8 border-l border-white/5 pl-8 relative">
                {experience && experience.length > 0 ? (
                  experience.map((exp: any) => (
                    <div key={exp.id} className="relative">
                      <div className="absolute -left-[41px] top-1 h-4 w-4 rounded-full bg-[#0a0a0c] border-2 border-primary" />
                      <div className="space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <h3 className="text-xl font-bold">{exp.role}</h3>
                          <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest bg-white/5 px-2 py-1 rounded">
                            {exp.startDate} — {exp.endDate || 'Present'}
                          </span>
                        </div>
                        <p className="text-primary font-semibold">{exp.company}</p>
                        <p className="text-sm text-muted-foreground leading-relaxed mt-4">
                          {exp.description}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground italic">Work history not yet listed.</p>
                )}
              </div>
            </section>

            <section className="space-y-8">
              <div className="flex items-center gap-3 text-primary">
                <Rocket className="h-5 w-5" />
                <h2 className="text-2xl font-bold font-headline">Featured Work</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {projects && projects.length > 0 ? (
                  projects.map((proj: any) => (
                    <Card key={proj.id} className="bg-white/5 border-none shadow-none hover:bg-white/10 transition-all overflow-hidden group">
                      <div className="h-32 bg-white/5 relative overflow-hidden">
                        {proj.imageUrl ? (
                          <img src={proj.imageUrl} alt={proj.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        ) : (
                          <div className="flex items-center justify-center h-full opacity-10">
                            <Rocket className="h-10 w-10" />
                          </div>
                        )}
                      </div>
                      <CardContent className="p-5 space-y-2">
                        <h3 className="font-bold text-lg">{proj.title}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {proj.description}
                        </p>
                        {proj.url && (
                          <Button variant="link" className="p-0 h-auto text-primary font-bold text-xs gap-1.5 mt-2" asChild>
                            <a href={proj.url} target="_blank" rel="noopener noreferrer">
                              Visit Project <Globe className="h-3 w-3" />
                            </a>
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <p className="text-muted-foreground italic col-span-full">No featured projects listed.</p>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>

      <footer className="container mx-auto px-6 max-w-5xl mt-24 pt-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-[0.2em]">
          &copy; {new Date().getFullYear()} {displayFullName} | Powered by NexusCRM
        </p>
        <Button size="sm" variant="ghost" className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground hover:text-white" asChild>
          <a href="/login">Manage Your Hub</a>
        </Button>
      </footer>
    </div>
  )
}