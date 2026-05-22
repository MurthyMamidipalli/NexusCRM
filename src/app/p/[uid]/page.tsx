
"use client"

import React, { useMemo } from 'react'
import { useParams } from 'next/navigation'
import { useFirestore, useDoc, useCollection } from '@/firebase'
import { doc, collection, query, where, orderBy } from 'firebase/firestore'
import { collections } from '@/lib/firestore-service'
import { Loader2, User, Mail, MapPin, Globe, Briefcase, Rocket, Lock } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export default function PublicProfilePage() {
  const params = useParams()
  const uid = params.uid as string
  const db = useFirestore()

  // Queries
  const profileRef = useMemo(() => uid ? doc(db, collections.PROFILES, uid) : null, [db, uid])
  const skillsQuery = useMemo(() => uid ? query(collection(db, collections.SKILLS), where('ownerId', '==', uid), orderBy('name', 'asc')) : null, [db, uid])
  const expQuery = useMemo(() => uid ? query(collection(db, collections.EXPERIENCE), where('ownerId', '==', uid), orderBy('startDate', 'desc')) : null, [db, uid])
  const projectsQuery = useMemo(() => uid ? query(collection(db, collections.PROJECTS), where('ownerId', '==', uid), orderBy('updatedAt', 'desc')) : null, [db, uid])

  const { data: profile, loading: profileLoading, error: profileError } = useDoc(profileRef)
  const { data: skills, loading: skillsLoading } = useCollection(skillsQuery)
  const { data: experience, loading: expLoading } = useCollection(expQuery)
  const { data: projects, loading: projectsLoading } = useCollection(projectsQuery)

  if (profileLoading || (uid && !profile && !profileError)) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0a0c]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  // Handle case where profile doesn't exist or visibility is turned off
  if (!profile || !profile.publicProfile || profileError) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-[#0a0a0c] text-white p-6 text-center">
        <div className="p-6 rounded-full bg-muted/10 mb-6">
          <Lock className="h-12 w-12 text-muted-foreground" />
        </div>
        <h1 className="text-4xl font-bold font-headline mb-4">Private Portfolio</h1>
        <p className="text-muted-foreground max-w-md text-lg">
          This professional hub is currently private or does not exist. Please contact the owner for access.
        </p>
        <div className="mt-8 flex flex-col gap-4">
          <Button variant="outline" className="border-white/10 text-white h-12 px-8 rounded-xl font-bold" asChild>
            <a href="/login">Create Your Own Hub</a>
          </Button>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest max-w-xs mt-4">
            Note: In development mode, links are restricted by workstation security (401 errors).
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white selection:bg-primary/30 pb-20">
      {/* Hero Header */}
      <div className="h-64 bg-gradient-to-br from-primary/20 via-accent/10 to-background border-b border-white/5" />
      
      <div className="container mx-auto px-4 md:px-6 max-w-5xl">
        <div className="flex flex-col md:flex-row items-end gap-8 -mt-20">
          <Avatar className="h-40 w-40 border-8 border-[#0a0a0c] shadow-2xl rounded-[2.5rem]">
            <AvatarImage src={profile.avatarUrl || `https://picsum.photos/seed/${uid}/200/200`} />
            <AvatarFallback className="bg-muted text-5xl">
              <User className="h-16 w-16 text-muted-foreground" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2 mb-2 text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-bold font-headline tracking-tight">{profile.fullName}</h1>
            <p className="text-xl text-primary font-semibold">{profile.tagline}</p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-4 text-sm text-muted-foreground font-medium uppercase tracking-widest">
              {profile.location && (
                <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {profile.location}</span>
              )}
              {profile.email && (
                <span className="flex items-center gap-1.5 lowercase italic"><Mail className="h-4 w-4" /> {profile.email.toLowerCase()}</span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mt-16">
          {/* Left Column: Bio & Skills */}
          <div className="space-y-12 lg:col-span-1">
            <section className="space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground border-b border-white/5 pb-2">About</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {profile.bio || "Professional background summary not provided."}
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

          {/* Right Column: Experience & Projects */}
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

      {/* Public Footer */}
      <footer className="container mx-auto px-6 max-w-5xl mt-24 pt-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-[0.2em]">
          &copy; {new Date().getFullYear()} {profile.fullName} | Powered by NexusCRM
        </p>
        <Button size="sm" variant="ghost" className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground hover:text-white" asChild>
          <a href="/login">Manage Your Intelligence</a>
        </Button>
      </footer>
    </div>
  )
}
