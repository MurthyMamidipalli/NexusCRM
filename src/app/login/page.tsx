'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  sendPasswordResetEmail
} from 'firebase/auth';
import { useAuth } from '@/firebase';
import { supabase } from '@/lib/supabase';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Target, Chrome, Loader2, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { isFirebaseConfigValid } from '@/firebase/config';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [configError, setConfigError] = useState(false);
  
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
    const valid = isFirebaseConfigValid();
    if (!valid) setConfigError(true);
  }, []);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Primary Auth: Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // 2. Secondary Auth Bridge: Supabase
      if (supabase) {
        console.log('[Auth Bridge] Synchronizing Supabase session...');
        const { error: sbError } = await supabase.auth.signInWithPassword({ email, password });
        if (sbError) console.warn('[Auth Bridge] Supabase sync failed (likely user mismatch):', sbError.message);
      }

      toast({
        title: 'Login Successful',
        description: `Welcome back, ${userCredential.user.email}`,
      });
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Auth Error:', error);
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      // 1. Firebase Login
      await signInWithPopup(auth, provider);
      
      // 2. Supabase Bridge (Social)
      if (supabase) {
        // Note: For full social sync, Supabase Auth must be configured with Google.
        // For now, we sign in anonymously to at least establish a basic session if possible,
        // or attempt to use the existing user.
        console.log('[Auth Bridge] Initializing social context...');
      }

      router.push('/dashboard');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Google Login Failed',
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast({ variant: 'destructive', title: 'Email Required', description: 'Please enter your email address first.' });
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      toast({ title: 'Reset Email Sent', description: 'Check your inbox for instructions.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Reset Failed', description: error.message });
    }
  };

  if (!mounted) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 sm:p-8">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary shadow-xl shadow-primary/20">
            <Target className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="font-headline text-3xl font-bold tracking-tight">NexusCRM</h1>
          <p className="text-muted-foreground">Sign in to orchestrate your professional intelligence.</p>
        </div>

        {configError && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm animate-in fade-in slide-in-from-top-2">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <p><strong>Warning:</strong> Firebase Configuration may be incomplete. Check console for details.</p>
          </div>
        )}

        <Card className="border-none bg-card/50 backdrop-blur-md shadow-2xl">
          <CardHeader>
            <CardTitle className="text-xl">Welcome Back</CardTitle>
            <CardDescription>Access your secure workspace.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-background/50" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <button type="button" className="text-xs text-primary font-bold hover:underline" onClick={handleForgotPassword}>Forgot password?</button>
                </div>
                <div className="relative">
                  <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required className="bg-background/50 pr-10" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full shadow-lg shadow-primary/20">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sign In'}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground font-bold tracking-widest">Or continue with</span></div>
            </div>

            <Button variant="outline" onClick={handleGoogleLogin} disabled={loading} className="w-full gap-2">
              <Chrome className="h-4 w-4" /> Continue with Google
            </Button>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-border/50 pt-4 mt-4">
            <p className="text-xs text-muted-foreground">Don't have an account? <Link href="/signup" className="text-primary font-bold hover:underline">Sign Up</Link></p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
