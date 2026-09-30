"use client";
import { useCallback,useEffect,useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { configured,supabase,errorMessage } from '@/lib/supabase';
import { LoadingState,ErrorState } from '@/components/states';
export default function PhysicalCard(){const {token}=useParams<{token:string}>();const [slug,setSlug]=useState('');const [name,setName]=useState('');const [membership,setMembership]=useState('');const [merchant,setMerchant]=useState(false);const [loading,setLoading]=useState(true);const [error,setError]=useState('');
 const load=useCallback(async()=>{if(!configured){setError('Cette carte est momentanément indisponible.');setLoading(false);return;}setLoading(true);setError('');try{
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token))throw new Error('Ce lien de carte n’est pas valide.');
  const c=supabase();const destination=await c.rpc('card_destination',{p_token:token});if(destination.error)throw destination.error;if(!destination.data)throw new Error('Cette carte est désactivée ou introuvable. Demandez une nouvelle carte au commerçant ; vos points restent liés à votre compte.');setSlug(destination.data);
  const b=await c.from('businesses').select('name').eq('slug',destination.data).maybeSingle();if(b.error)throw b.error;setName(b.data?.name||destination.data);
  const {data:{user}}=await c.auth.getUser();if(user){const physical=await c.from('physical_cards').select('membership_id,business_id,status').eq('token',token).maybeSingle();if(physical.error)throw physical.error;if(physical.data?.membership_id){setMembership(physical.data.membership_id);const owner=await c.from('businesses').select('id').eq('id',physical.data.business_id).eq('owner_id',user.id).maybeSingle();if(owner.error)throw owner.error;if(owner.data){setMerchant(true);location.replace(`/business/caisse?membership=${physical.data.membership_id}`);return;}}}
 }catch(e){setError(errorMessage(e));}finally{setLoading(false);}},[token]);
 useEffect(()=>{void load();},[load]);
 if(loading)return <LoadingState label="Lecture de votre carte…"/>;if(error)return <ErrorState message={error} onRetry={()=>void load()}/>;
 return <div className="container page narrow"><section className="physical-claim-card"><span className="kicker">VOTRE CARTE FIDELI</span><span className="empty-symbol" aria-hidden="true">✳</span><h1>Bienvenue chez {name}.</h1><p>Identifiez-vous pour connecter cette carte à vos points, vos récompenses et votre historique.</p><Link className="button dark full" href={`/join/${slug}?card=${encodeURIComponent(token)}`}>{membership?'Retrouver ma carte':'Connecter ma carte'} →</Link>{merchant&&membership&&<Link className="button outline full" href={`/business/caisse?membership=${membership}`}>Ouvrir la fiche en caisse</Link>}<p className="form-note">Votre compte garde vos points, même si vous perdez cette carte.</p>{!merchant&&<Link className="text-link" href={`/business/login?next=${encodeURIComponent(`/card/${token}`)}`}>Vous êtes commerçant ? Ouvrir cette carte en caisse →</Link>}</section></div>;
}
