"use client";
import { Suspense,useState,useRef,type FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { configured,supabase,errorMessage } from '@/lib/supabase';
import { getPublicOrigin } from '@/lib/use-public-origin';
import { safeNext } from '@/lib/public-origin';
import { LoadingState } from '@/components/states';
function Login(){const requested=useSearchParams().get('next');const [email,setEmail]=useState('');const [message,setMessage]=useState('');const [busy,setBusy]=useState(false);const lock=useRef(false);
 const submit=async(e:FormEvent)=>{e.preventDefault();if(lock.current)return;lock.current=true;setBusy(true);setMessage('');try{const origin=await getPublicOrigin();const next=safeNext(requested);const {error}=await supabase().auth.signInWithOtp({email:email.trim(),options:{emailRedirectTo:`${origin}/auth/callback?next=${encodeURIComponent(next)}`,shouldCreateUser:false}});if(error)throw error;setMessage('Si cette adresse est liée à une carte, un lien de connexion vient de vous être envoyé. Vérifiez aussi les courriers indésirables.');}catch(e){setMessage(errorMessage(e));}finally{setBusy(false);lock.current=false;}};
 return <div className="container page narrow auth-card"><span className="kicker">VOTRE ESPACE FIDÉLITÉ</span><h1>Vos cartes, simplement.</h1><p>Retrouvez vos points, vos récompenses et votre historique avec votre email.</p>{configured?<form onSubmit={submit}><label>Email de votre carte<input type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label><button className="button dark full" disabled={busy}>{busy?'Envoi du lien…':'Recevoir mon lien de connexion'}</button></form>:<p role="alert">La connexion est momentanément indisponible.</p>}{message&&<p className="form-message" role="status">{message}</p>}<div className="empty-inline"><strong>Pas encore de carte ?</strong><p>Scannez le QR de votre commerce pour rejoindre son programme.</p></div><Link href="/privacy" className="text-link">Vos données et votre confidentialité</Link></div>;
}
export default function Page(){return <Suspense fallback={<LoadingState/>}><Login/></Suspense>;}
