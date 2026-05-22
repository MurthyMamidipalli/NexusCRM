"use client"

import React, { useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { useFirestore, useDoc, useCollection } from '@/firebase'
import { doc, collection, query, where } from 'firebase/firestore'
import { collections } from '@/lib/firestore-service'
import { 
  Loader2, 
  User, 
  Mail, 
  MapPin, 
  Globe, 
  Briefcase, 
  Rocket, 
  Lock, 
  GraduationCap, 
  Trophy, 
  ExternalLink, 
  FileText, 
  Download, 
  Eye, 
  Github,
  Linkedin,
  Twitter,
  X
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'

export default function PublicProfilePage() {
  const params = useParams()
  const uid = params.uid as string
  const db = useFirestore()
  const [previewFile, setPreviewFile] = useState<{ url: string; name: string } | null>(null)
  
  const profileRef = useMemo(() => uid && db ? doc(db, collections.PROFILES, uid) : null, [db, uid])
  const { data: profileDoc, loading: profileLoading } = useDoc(profileRef, { silent: true })

  const isVisible = profileDoc && profileDoc.isPublic === true

  const skillsQuery = useMemo(() => 
    isVisible && uid && db ? query(collection(db, collections.SKILLS), where('ownerId', '==', uid)) : null, 
    [db, uid, isVisible]
  )
  const expQuery = useMemo(() => 
    isVisible && uid && db ? query(collection(db, collections.EXPERIENCE), where('ownerId', '==', uid)) : null, 
    [db, uid, isVisible]
  )
  const projectsQuery = useMemo(() => 
    isVisible && uid && db ? query(collection(db, collections.PROJECTS), where('ownerId', '==', uid)) : null, 
    [db, uid, isVisible]
  )
  const eduQuery = useMemo(() => 
    isVisible && uid && db ? query(collection(db, collections.EDUCATION), where('ownerId', '==', uid)) : null, 
    [db, uid, isVisible]
  )
  
  // Restricted visibility queries
  const certQuery = useMemo(() => 
    isVisible && uid && db ? query(collection(db, collections.CERTIFICATIONS), where('ownerId', '==', uid), where('isPublic', '==', true)) : null, 
    [db, uid, isVisible]
  )
  const resumeQuery = useMemo(() => 
    isVisible && uid && db ? query(collection(db, collections.RESUMES), where('ownerId', '==', uid), where('isPublic', '==', true)) : null, 
    [db, uid, isVisible]
  )
  const docsQuery = useMemo(() => 
    isVisible && uid && db ? query(collection(db, collections.DOCUMENTS), where('ownerId', '==', uid), where('isPublic', '==', true)) : null, 
    [db, uid, isVisible]
  )
  const linksQuery = useMemo(() => 
    isVisible && uid && db ? query(collection(db, collections.LINKS), where('ownerId', '==', uid)) : null, 
    [db, uid, isVisible]
  )

  const { data: skills, loading: skillsLoading } = useCollection(skillsQuery, { silent: true })
  const { data: rawExp } = useCollection(expQuery, { silent: true })
  const { data: rawProjects } = useCollection(projectsQuery, { silent: true })
  const { data: rawEdu } = useCollection(eduQuery, { silent: true })
  const { data: certifications } = useCollection(certQuery, { silent: true })
  const { data: links } = useCollection(linksQuery, { silent: true })
  const { data: resumes } = useCollection(resumeQuery, { silent: true })
  const { data: publicDocuments } = useCollection(docsQuery, { silent: true })

  const experience = useMemo(() => {
    if (!rawExp) return []
    return [...rawExp].sort((a: any, b: any) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
  }, [rawExp])

  const projects = useMemo(() => {
    if (!rawProjects) return []
    return [...rawProjects].sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
  }, [rawProjects])

  const education = useMemo(() => {
    if (!rawEdu) return []
    return [...rawEdu].sort((a: any, b: any) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
  }, [rawEdu])

  const getLinkIcon = (label: string) => {
    const l = label.toLowerCase()
    if (l.includes('github')) return <Github className="h-4 w-4" />
    if (l.includes('linkedin')) return <Linkedin className="h-4 w-4" />
    if (l.includes('twitter')) return <Twitter className="h-4 w-4" />
    return <Globe className="h-4 w-4" />
  }

  if (profileLoading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-[#0a0a0c]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-4 text-xs text-muted-foreground uppercase tracking-widest font-bold animate-pulse">
          Connecting to Nexus Hub...
        </p>
      </div>
    )
  }

  if (!isVisible) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-[#0a0a0c] text-white p-6 text-center">
        <div className="p-6 rounded-full bg-muted/10 mb-6">
          <Lock className="h-12 w-12 text-muted-foreground" />
        </div>
        <h1 className="text-4xl font-bold font-headline mb-4">Private Portfolio</h1>
        <p className="text-muted-foreground max-w-md text-lg leading-relaxed">
          This professional hub is currently private.
        </p>
        <div className="mt-8">
          <Button variant="outline" className="border-white/10 text-white h-12 px-8 rounded-xl font-bold" asChild>
            <a href="/login">Sign In to Dashboard</a>
          </Button>
        </div>
      </div>
    )
  }

  const activeProfile = profileDoc;
  const displayFullName = activeProfile.fullName || `${activeProfile.firstName || ''} ${activeProfile.lastName || ''}`.trim() || 'Professional User';

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
                {activeProfile.bio || "Professional background summary pending."}
              </p>
            </section>

            {resumes && resumes.length > 0 && (
              <section className="space-y-6">
                <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground border-b border-white/5 pb-2">Resume Vault</h2>
                <div className="grid grid-cols-1 gap-4">
                  {resumes.map((res: any) => (
                    <Card key={res.id} className="bg-[#121214] border-white/10 shadow-lg overflow-hidden group hover:border-primary/50 transition-all">
                      <CardContent className="p-5 space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold truncate text-white">{res.name}</span>
                            <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">{res.type === 'file' ? 'PDF Document' : 'External Link'}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {res.type === 'file' ? (
                            <>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex-1 text-[10px] h-9 font-bold gap-2 bg-white/5 border-white/5 hover:bg-white/10"
                                onClick={() => setPreviewFile({ url: res.fileUrl, name: res.name })}
                              >
                                <Eye className="h-3.5 w-3.5" /> View
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex-1 text-[10px] h-9 font-bold gap-2 bg-primary text-white border-none hover:bg-primary/90"
                                asChild
                              >
                                <a href={res.fileUrl} download={res.fileName || 'resume.pdf'}><Download className="h-3.5 w-3.5" /> Download</a>
                              </Button>
                            </>
                          ) : (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full text-[10px] h-9 font-bold gap-2 bg-primary text-white border-none hover:bg-primary/90"
                              asChild
                            >
                              <a href={res.url} target="_blank" rel="noopener noreferrer"><Globe className="h-3.5 w-3.5" /> Visit CV</a>
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {publicDocuments && publicDocuments.length > 0 && (
              <section className="space-y-6">
                <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground border-b border-white/5 pb-2">Public Documents</h2>
                <div className="grid grid-cols-1 gap-4">
                  {publicDocuments.map((doc: any) => (
                    <Card key={doc.id} className="bg-[#121214] border-white/10 shadow-lg group hover:border-primary/50 transition-all">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-primary/50" />
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold truncate text-white">{doc.name}</span>
                            <span className="text-[8px] text-muted-foreground uppercase font-bold tracking-widest">{doc.category}</span>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/5" onClick={() => setPreviewFile({ url: doc.fileUrl, name: doc.name })}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {links && links.length > 0 && (
              <section className="space-y-6">
                <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground border-b border-white/5 pb-2">Links</h2>
                <div className="flex flex-col gap-2">
                  {links.map((link: any) => (
                    <a 
                      key={link.id} 
                      href={link.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        {getLinkIcon(link.label)}
                        <span className="text-xs font-bold">{link.label}</span>
                      </div>
                      <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  ))}
                </div>
              </section>
            )}

            <section className="space-y-6">
              <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground border-b border-white/5 pb-2">Expertise</h2>
              <div className="flex flex-wrap gap-2">
                {skillsLoading ? (
                  <div className="flex items-center gap-2 text-muted-foreground animate-pulse">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span className="text-[10px] uppercase font-bold tracking-widest">Loading...</span>
                  </div>
                ) : skills && skills.length > 0 ? (
                  skills.map((skill: any) => (
                    <Badge key={skill.id} variant="outline" className="bg-white/5 border-white/10 py-1.5 px-3 text-[11px] uppercase tracking-widest font-bold">
                      {skill.name}
                    </Badge>
                  ))
                ) : (
                  <p className="text-xs italic text-muted-foreground">Expertise mapping in progress.</p>
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
                {experience.length > 0 ? (
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
                        <p className="text-sm text-muted-foreground leading-relaxed mt-4 whitespace-pre-wrap">
                          {exp.description}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground italic">No work history listed yet.</p>
                )}
              </div>
            </section>

            {education.length > 0 && (
              <section className="space-y-8">
                <div className="flex items-center gap-3 text-primary">
                  <GraduationCap className="h-5 w-5" />
                  <h2 className="text-2xl font-bold font-headline">Academic Background</h2>
                </div>
                <div className="space-y-6">
                  {education.map((edu: any) => (
                    <div key={edu.id} className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h3 className="text-lg font-bold">{edu.institution}</h3>
                          <p className="text-sm text-primary font-semibold">{edu.degree} in {edu.fieldOfStudy}</p>
                        </div>
                        <Badge variant="outline" className="text-[10px] uppercase font-bold border-white/10">
                          {edu.startDate?.split('-')[0]} — {edu.endDate?.split('-')[0] || 'Present'}
                        </Badge>
                      </div>
                      {edu.description && (
                        <p className="text-xs text-muted-foreground leading-relaxed italic">{edu.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {certifications && certifications.length > 0 && (
              <section className="space-y-8">
                <div className="flex items-center gap-3 text-primary">
                  <Trophy className="h-5 w-5" />
                  <h2 className="text-2xl font-bold font-headline">Certifications</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {certifications.map((cert: any) => (
                    <Card key={cert.id} className="bg-white/5 border-white/10 shadow-none">
                      <CardContent className="p-5 space-y-3">
                        <h4 className="font-bold text-sm leading-tight">{cert.title}</h4>
                        <p className="text-[10px] text-primary font-bold uppercase tracking-widest">{cert.issuer}</p>
                        <div className="flex flex-col gap-3 pt-2">
                          <span className="text-[9px] text-muted-foreground">{cert.date}</span>
                          <div className="flex flex-wrap gap-2">
                            {cert.externalLink && (
                              <Button variant="link" size="sm" className="p-0 h-auto text-[9px] text-primary" asChild>
                                <a href={cert.externalLink} target="_blank" rel="noopener noreferrer">Verify Credential</a>
                              </Button>
                            )}
                            {cert.documentUrl && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-[9px] h-7 px-2 border-white/10 hover:bg-white/5"
                                onClick={() => setPreviewFile({ url: cert.documentUrl, name: cert.title })}
                              >
                                <Eye className="h-3 w-3 mr-1.5" /> View Document
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            <section className="space-y-8">
              <div className="flex items-center gap-3 text-primary">
                <Rocket className="h-5 w-5" />
                <h2 className="text-2xl font-bold font-headline">Featured Projects</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {projects.length > 0 ? (
                  projects.map((proj: any) => (
                    <Card key={proj.id} className="bg-white/5 border-none shadow-none hover:bg-white/10 transition-all overflow-hidden group rounded-[24px]">
                      <div className="aspect-[16/10] bg-white/5 relative overflow-hidden">
                        {proj.imageUrl ? (
                          <img src={proj.imageUrl} alt={proj.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        ) : (
                          <div className="flex items-center justify-center h-full opacity-10">
                            <Rocket className="h-10 w-10" />
                          </div>
                        )}
                      </div>
                      <CardContent className="p-6 space-y-3">
                        <h3 className="font-bold text-xl">{proj.title}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                          {proj.description}
                        </p>
                        {proj.url && (
                          <Button variant="outline" className="w-full mt-4 text-[10px] font-bold h-10 rounded-xl bg-white/5 border-white/5 hover:bg-primary" asChild>
                            <a href={proj.url} target="_blank" rel="noopener noreferrer">
                              View Project Live <Globe className="h-3 w-3 ml-2" />
                            </a>
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <p className="text-muted-foreground italic col-span-full">No technical projects highlighted.</p>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>

      <Dialog open={!!previewFile} onOpenChange={(open) => !open && setPreviewFile(null)}>
        <DialogContent className="sm:max-w-[90vw] h-[90vh] p-0 bg-[#0f1115] text-white border-none rounded-2xl overflow-hidden flex flex-col">
          <div className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-[#1a1c21]">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-primary" />
              <DialogTitle className="font-bold text-sm truncate">
                {previewFile?.name}
              </DialogTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setPreviewFile(null)} className="h-8 w-8 hover:bg-white/5">
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex-1 bg-black/40">
            {previewFile?.url && (
              <iframe 
                src={previewFile.url} 
                className="w-full h-full border-none"
                title={previewFile.name}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <footer className="container mx-auto px-6 max-w-5xl mt-24 pt-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 text-center">
        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-[0.2em]">
          &copy; {new Date().getFullYear()} {displayFullName} | Professional Intelligence Hub
        </p>
        <Button size="sm" variant="ghost" className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground hover:text-white" asChild>
          <a href="/login">Access Dashboard</a>
        </Button>
      </footer>
    </div>
  )
}
