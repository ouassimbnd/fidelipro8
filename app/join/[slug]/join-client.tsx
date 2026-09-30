"use client";
import { Suspense,useCallback,useEffect,useRef,useState,type FormEvent } from 'react';
import { useParams,useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { configured,supabase,errorMessage } from '@/lib/supabase';
import { getPublicOrigin } from '@/lib/use-public-origin';
import { commerceFor } from '@/lib/commerce';
import { LoadingState,ErrorState } from '@/components/states';
type Business={id:string;name:string;slug:string;category:string|null;address:string|null;description:string|null;hours:string|null;phone:string|null};
type Program={id:string;reward_name:string;required_visits:number};
function JoinContent(){
 const {slug}=useParams<{slug:string}>();const query=useSearchParams();const card=query.get('card');const complete=query.get('complete')==='1';
 const [business,setBusiness]=useState<Business|null>(null);const [program,setProgram]=useState<Program|null>(null);
 const [name,setName]=useState('');const [email,setEmail]=useState('');const [phone,setPhone]=useState('');const [birthDate,setBirthDate]=useState('');const [marketing,setMarketing]=useState(false);const [signedIn,setSignedIn]=useState(false);
 const [message,setMessage]=useState('');const [error,setError]=useState('');const [busy,setBusy]=useState(false);const [loading,setLoading]=useState(true);const [sent,setSent]=useState(false);const [cooldown,setCooldown]=useState(0);const lock=useRef(false);
 const finish=useCallback(async(programId:string,userId:string,displayName:string)=>{
  const client=supabase();let {data:customer,error:ce}=await client.from('customers').select('id,display_name').eq('auth_user_id',userId).maybeSingle();if(ce)throw ce;
  if(!customer){const created=await client.from('customers').insert({auth_user_id:userId,display_name:displayName.trim(),phone:phone.trim()||null,birth_date:birthDate||null,marketing_consent:marketing,marketing_consent_at:marketing?new Date().toISOString():null,privacy_accepted_at:new Date().toISOString()}).select('id,display_name').single();if(created.error)throw created.error;customer=created.data;}
  let {data:membership,error:me}=await client.from('memberships').select('id').eq('customer_id',customer!.id).eq('program_id',programId).maybeSingle();if(me)throw me;
  if(!membership){const created=await client.from('memberships').insert({customer_id:customer!.id,program_id:programId}).select('id').single();if(created.error)throw created.error;membership=created.data;}
  if(card){const result=await client.rpc('claim_card',{p_token:card,p_membership:membership!.id});if(result.error)throw result.error;}
  try{sessionStorage.removeItem(`fideli-join:${slug}`);}catch{}location.replace(`/customer?membership=${membership!.id}`);
 },[slug,card,phone,birthDate,marketing]);
 const load=useCallback(async()=>{
  if(!configured){setError('Ce programme est momentanément indisponible. Réessayez plus tard.');setLoading(false);return;}
  setLoading(true);setError('');try{
   const client=supabase();const {data:b,error:be}=await client.from('businesses').select('id,name,slug,category,address,description,hours,phone').eq('slug',slug).maybeSingle();if(be)throw be;if(!b)throw new Error('Ce commerce est introuvable. Vérifiez le QR code auprès du commerçant.');setBusiness(b);
   const {data:p,error:pe}=await client.from('programs').select('id,reward_name,required_visits').eq('business_id',b.id).eq('active',true).maybeSingle();if(pe)throw pe;if(!p)throw new Error('Ce commerce n’a pas encore activé son programme de fidélité.');setProgram(p);
   const {data:{user},error:ae}=await client.auth.getUser();if(ae&&ae.name!=='AuthSessionMissingError')throw ae;
   if(user){setSignedIn(true);setEmail(user.email||'');const {data:c,error:ce}=await client.from('customers').select('id,display_name').eq('auth_user_id',user.id).maybeSingle();if(ce)throw ce;
    let cached='';try{cached=sessionStorage.getItem(`fideli-join:${slug}`)||'';}catch{}const displayName=c?.display_name||cached||user.user_metadata?.display_name||'';setName(displayName);
    if(c){const {data:m,error:me}=await client.from('memberships').select('id').eq('customer_id',c.id).eq('program_id',p.id).maybeSingle();if(me)throw me;if(m){if(card){const claimed=await client.rpc('claim_card',{p_token:card,p_membership:m.id});if(claimed.error)throw claimed.error;}location.replace(`/customer?membership=${m.id}`);return;}}
    if(complete&&displayName.trim().length>=2){await finish(p.id,user.id,displayName);return;}
   }
  }catch(e){setError(errorMessage(e));}finally{setLoading(false);}
 },[slug,card,complete,finish]);
 useEffect(()=>{void load();},[load]);
 useEffect(()=>{if(!cooldown)return;const timer=setTimeout(()=>setCooldown(n=>n-1),1000);return()=>clearTimeout(timer);},[cooldown]);
 const submit=async(e:FormEvent)=>{
  e.preventDefault();if(!program||lock.current||cooldown>0)return;lock.current=true;setBusy(true);setMessage('');try{
   const client=supabase();const {data:{user},error:ae}=await client.auth.getUser();if(ae&&ae.name!=='AuthSessionMissingError')throw ae;
   if(user){await finish(program.id,user.id,name);return;}
   const origin=await getPublicOrigin();const next=`/join/${encodeURIComponent(slug)}?complete=1${card?`&card=${encodeURIComponent(card)}`:''}`;
   try{sessionStorage.setItem(`fideli-join:${slug}`,name.trim());}catch{}
   const {error}=await client.auth.signInWithOtp({email:email.trim(),options:{emailRedirectTo:`${origin}/auth/callback?next=${encodeURIComponent(next)}`,data:{display_name:name.trim()},shouldCreateUser:true}});if(error)throw error;
   setSent(true);setCooldown(45);setMessage('Votre lien est envoyé. Ouvrez l’email et appuyez sur le lien pour retrouver votre carte. Pensez à vérifier les courriers indésirables.');
  }catch(e){setMessage(errorMessage(e));}finally{lock.current=false;setBusy(false);}
 };
 if(loading)return <LoadingState label="Préparation de votre carte…"/>;
 if(error)return <ErrorState message={error} onRetry={()=>void load()}/>;
 const sector=commerceFor(business?.category);
 return <div className="join-bg"><div className="join-progress" aria-label="Étapes d’inscription"><span className="complete">1. Scanner</span><span className="active">2. S’identifier</span><span>3. Profiter</span></div><div className="container join-layout"><div className="join-intro"><span className="kicker">{sector.name}</span><div className="join-logo">{sector.symbol}</div><h1>{business?.name}</h1>{business?.address&&<p>{business.address}</p>}<p>{business?.description||sector.welcome}</p><div className="join-promise"><span>✳</span><div><strong>Votre première récompense</strong><p>{program?.reward_name} · {Number(program?.required_visits||0)*10} points</p><small>10 points par passage · 5 points par retour privé</small></div></div>{business?.hours&&<p className="business-hours"><strong>Horaires</strong><br/>{business.hours}</p>}</div><div className="join-panel"><span className="kicker">{sent?'VÉRIFIEZ VOTRE EMAIL':'VOTRE CARTE PERSONNELLE'}</span><h2>{sent?'Votre carte vous attend.':signedIn?'Bienvenue chez nous.':'Un QR. Votre fidélité.'}</h2><p>{sent?`Un lien a été envoyé à ${email}.`:'Votre profil, vos points, vos récompenses et votre historique, au même endroit.'}</p>
 <form onSubmit={submit}><label htmlFor="name">Votre prénom ou nom d’usage</label><input id="name" required minLength={2} maxLength={60} value={name} onChange={e=>setName(e.target.value)} autoComplete="given-name" disabled={busy}/><label htmlFor="email">Votre email</label><input id="email" type="email" required value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" readOnly={signedIn} disabled={busy}/><div className="optional-grid"><label htmlFor="phone">Téléphone <span>facultatif</span></label><input id="phone" type="tel" maxLength={30} value={phone} onChange={e=>setPhone(e.target.value)} autoComplete="tel" disabled={busy} placeholder="Pour recevoir vos avantages si vous l’acceptez"/><label htmlFor="birth">Anniversaire <span>facultatif</span></label><input id="birth" type="date" value={birthDate} onChange={e=>setBirthDate(e.target.value)} disabled={busy}/></div><p className="form-note">Le téléphone peut servir aux avantages personnalisés. La date d’anniversaire permet au commerce de prévoir une attention spéciale. Ces champs restent facultatifs.</p><label className="privacy-check"><input type="checkbox" checked={marketing} onChange={e=>setMarketing(e.target.checked)} disabled={busy}/> J’accepte de recevoir les offres fidélité de ce commerce. Facultatif, révocable à tout moment.</label><p className="form-note">Connexion sécurisée par email, sans mot de passe. Aucune application à installer.</p><label className="privacy-check"><input type="checkbox" required disabled={busy}/> J’ai lu les <Link href="/privacy">informations sur mes données</Link> pour gérer ma carte.</label><button className="button dark full" disabled={busy||cooldown>0}>{busy?'Préparation…':cooldown>0?`Renvoyer dans ${cooldown} s`:signedIn?'Créer ma carte →':sent?'Renvoyer le lien':'Recevoir mon lien sécurisé →'}</button></form>{message&&<p className="form-message" role="status">{message}</p>}<div className="join-benefits"><span>✓ Points enregistrés</span><span>✓ Récompenses accessibles</span><span>✓ Carte sur téléphone</span></div>{!signedIn&&<p className="form-note">Déjà membre ? Utilisez le même email pour retrouver vos points.</p>}</div></div></div>;
}
export default function JoinClient(){return <Suspense fallback={<LoadingState/>}><JoinContent/></Suspense>;}
