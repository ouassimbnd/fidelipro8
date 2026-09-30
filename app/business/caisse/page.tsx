"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { commerceFor,displayDate } from "@/lib/commerce";
import { membershipFromScan } from "@/lib/public-origin";
import { LoadingState,ErrorState } from "@/components/states";
import { configured, supabase, errorMessage } from "@/lib/supabase";
type Member={id:string;name:string;points:number;visits:number};
type Reward={id:string;name:string;points_cost:number};
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function CashRegister(){
 const [category,setCategory]=useState("");
 const [setupError,setSetupError]=useState("");
 const [history,setHistory]=useState<{kind:string;created_at:string;detail:string|null}[]>([]);
 const [historyLoading,setHistoryLoading]=useState(false);
 const [historyError,setHistoryError]=useState("");
 const requested=useSearchParams().get("membership");
 const [business,setBusiness]=useState(""); const [program,setProgram]=useState("");
 const [query,setQuery]=useState(requested||"");const [members,setMembers]=useState<Member[]>([]);
 const [member,setMember]=useState<Member|null>(null);const [cashiers,setCashiers]=useState<{id:string;name:string}[]>([]);
 const [cashier,setCashier]=useState("");const [rewards,setRewards]=useState<Reward[]>([]);
 const [loading,setLoading]=useState(true);const [busy,setBusy]=useState(false);const [searching,setSearching]=useState(false);const [message,setMessage]=useState("");const lock=useRef(false);
 useEffect(()=>{ if(!configured){setLoading(false);return;}void(async()=>{try{
  const c=supabase();const {data:{user},error}=await c.auth.getUser();if(error&&error.name!=="AuthSessionMissingError")throw error;if(!user){location.replace(`/business/login?next=${encodeURIComponent(location.pathname+location.search)}`);return;}
  const {data:b,error:be}=await c.from("businesses").select("id,category").eq("owner_id",user.id).maybeSingle();if(be)throw be;if(!b){location.replace("/business/new");return;}
  setCategory(b.category||"");
  const {data:p,error:pe}=await c.from("programs").select("id").eq("business_id",b.id).eq("active",true).maybeSingle();if(pe)throw pe;if(!p)throw new Error("Aucun programme actif pour cet établissement.");
  const [cs,rs]=await Promise.all([c.from("cashiers").select("id,name").eq("business_id",b.id).eq("active",true),c.from("rewards").select("id,name,points_cost").eq("program_id",p.id).eq("active",true).order("points_cost")]);
  if(cs.error||rs.error)throw cs.error||rs.error;setCashiers(cs.data||[]);setRewards(rs.data||[]);setProgram(p.id);setBusiness(b.id);
  const remembered=localStorage.getItem(`fideli-cashier:${b.id}`);if(remembered&&(cs.data||[]).some(c=>c.id===remembered))setCashier(remembered);
 }catch(e){setSetupError(errorMessage(e));}finally{setLoading(false);}})();},[]);
 const readMember=async(id:string,programId:string):Promise<Member|null>=>{
  const c=supabase();const {data:m,error}=await c.from("memberships").select("id,customer:customers(display_name)").eq("id",id).eq("program_id",programId).maybeSingle();if(error)throw error;if(!m)return null;
  const [v,f]=await Promise.all([c.from("visits").select("id",{count:"exact",head:true}).eq("membership_id",id),c.from("private_feedback").select("id",{count:"exact",head:true}).eq("membership_id",id)]);if(v.error||f.error)throw v.error||f.error;
  let spent=0,offset=0;
  while(true){const r=await c.from("redemptions").select("id,points_spent").eq("membership_id",id).order("id").range(offset,offset+999);if(r.error)throw r.error;spent+=(r.data||[]).reduce((sum,r)=>sum+(r.points_spent||0),0);if((r.data||[]).length<1000)break;offset+=1000;}
  const customer=m.customer as unknown as {display_name:string};return {id:m.id,name:customer.display_name,visits:v.count||0,points:Math.max(0,(v.count||0)*10+(f.count||0)*5-spent)};
 };
 useEffect(()=>{if(!business)return;let cancelled=false;setSearching(true);const timer=setTimeout(()=>{void(async()=>{try{
  const value=query.trim();const scanned=membershipFromScan(value);
  let physicalToken="";try{const url=new URL(value);const match=url.pathname.match(/^\/card\/([0-9a-f-]+)\/?$/i);if(match)physicalToken=match[1];}catch{}
  if(scanned||physicalToken){let id=scanned;if(physicalToken){const r=await supabase().from("physical_cards").select("membership_id,status").eq("token",physicalToken).eq("business_id",business).maybeSingle();if(r.error)throw r.error;if(r.data?.status!=="active"||!r.data.membership_id)throw new Error("Cette carte n’est pas active ou n’est pas encore associée à un client.");id=r.data.membership_id;}
   const found=id?await readMember(id,program):null;if(!cancelled){setMembers(found?[found]:[]);setMember(found);}
  } else {const r=await supabase().rpc("business_overview",{p_business:business,p_offset:0,p_search:value||null});if(r.error)throw r.error;if(!cancelled)setMembers(r.data.members||[]);}
 }catch(e){if(!cancelled){setMembers([]);setMessage(errorMessage(e));}}finally{if(!cancelled)setSearching(false);}})();},250);return()=>{cancelled=true;clearTimeout(timer);};},[query,business,program]);
 useEffect(()=>{if(!member){setHistory([]);return;}let active=true;setHistoryLoading(true);setHistoryError("");void supabase().rpc("member_history",{p_membership:member.id}).then(({data,error})=>{if(active){if(error){setHistory([]);setHistoryError("L’historique est momentanément indisponible.");}else setHistory(data||[]);setHistoryLoading(false);}});return()=>{active=false;};},[member]);
 const select=async(m:Member)=>{if(lock.current)return;lock.current=true;setBusy(true);setMessage("");try{setMember(await readMember(m.id,program));}catch(e){setMessage(errorMessage(e));}finally{lock.current=false;setBusy(false);}};
 const act=async(reward?:Reward)=>{if(!member||lock.current)return;if(reward&&!confirm(`Remettre « ${reward.name} » à ${member.name} pour ${reward.points_cost} points ?`))return;lock.current=true;setBusy(true);setMessage("");try{
 const r=reward?await supabase().rpc("redeem_reward",{p_membership:member.id,p_reward:reward.id}):await supabase().rpc("record_visit",{p_membership:member.id,p_cashier:cashier||null});if(r.error)throw r.error;
 const fresh=await readMember(member.id,program);setMember(fresh);if(fresh)setMembers(items=>items.map(m=>m.id===fresh.id?fresh:m));setMessage(reward?"Récompense remise. Les points ont été déduits.":"Visite enregistrée : +10 points pour votre client.");
 }catch(e){setMessage(errorMessage(e));}finally{setBusy(false);lock.current=false;}};
 if(loading)return <LoadingState label="Ouverture de votre caisse…"/>;
 if(setupError)return <ErrorState message={setupError} onRetry={()=>location.reload()}/>;
 const sector=commerceFor(category);
 return <div className="container page dashboard"><div className="dashboard-header"><div><span className="kicker">AU COMPTOIR</span><h1>Un client. Une attention.</h1><p>Retrouvez sa carte, validez son passage ou remettez une récompense.</p></div><Link className="button outline" href="/business/equipe">Gérer l’équipe</Link></div>
 {message&&<p className="app-message" role="status">{message}</p>}
 {!configured?<section className="panel"><h2>Configuration requise</h2><p>Connectez Supabase pour ouvrir votre caisse. Consultez le guide de mise en service fourni avec le projet.</p></section>:loading?<p role="status">Ouverture de la caisse…</p>:<div className="register-grid"><section className="panel"><span className="kicker">01 / RETROUVER UN CLIENT</span><h2>Sa fidélité commence ici.</h2><label className="field-label" htmlFor="client-search">Nom, identifiant ou lien du QR Wallet</label><input id="client-search" className="app-input" type="search" value={query} onChange={e=>{setQuery(e.target.value);setMember(null);setMessage("");}} placeholder="Rechercher ou coller le lien de la carte"/><p className="form-note">Scannez le QR avec l’appareil photo de votre téléphone ou une douchette QR. Vous pouvez aussi rechercher le prénom du client.</p>
 {searching?<p role="status">Recherche…</p>:!members.length?<div className="empty-state"><IconPlaceholder/><h3>Aucun client trouvé</h3><p>Vérifiez votre recherche ou invitez votre premier client.</p><Link href="/business/cartes" className="button outline">Afficher le QR d’inscription</Link></div>:<div className="register-results">{members.map(m=><button key={m.id} disabled={busy} className={member?.id===m.id?"selected":""} onClick={()=>void select(m)}><span className="avatar">{m.name.slice(0,1).toUpperCase()}</span><span><strong>{m.name}</strong><small>{m.visits} visites</small></span><b>{m.points} pts →</b></button>)}</div>}{members.length===25&&<p className="form-note">25 résultats affichés. Précisez votre recherche.</p>}</section>
 <section className="panel register-detail"><span className="kicker">02 / VALIDER LE PASSAGE</span>{!member?<div className="empty-state"><IconPlaceholder/><h2>Prêt à accueillir.</h2><p>Sélectionnez un client pour retrouver son solde et ses récompenses.</p></div>:<><h2>{member.name}</h2><div className="register-balance">{member.points}<span>points disponibles</span></div><label className="caisse-select">Visite attribuée à<select value={cashier} onChange={e=>{setCashier(e.target.value);localStorage.setItem(`fideli-cashier:${business}`,e.target.value);}}><option value="">Propriétaire</option>{cashiers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><button className="button dark full" disabled={busy} onClick={()=>void act()}>{busy?"Enregistrement…":"Valider le passage · +10 points"}</button><p className="form-note">{sector.passage.charAt(0).toUpperCase()+sector.passage.slice(1)} validé en caisse. Le compte client est mis à jour après chaque opération.</p><h3 className="register-rewards-title">Récompenses du client</h3>{!rewards.length?<p>Aucune récompense. <Link href="/business/programme">Créer une récompense</Link></p>:rewards.map(r=><div className="register-reward" key={r.id}><div><strong>{r.name}</strong><small>{r.points_cost} points</small></div><button className="button outline" disabled={busy||member.points<r.points_cost} onClick={()=>void act(r)}>{member.points>=r.points_cost?"Remettre":`${r.points_cost-member.points} pts restants`}</button></div>)}<details className="register-history"><summary>Dernières opérations</summary>{historyLoading?<p>Chargement…</p>:historyError?<p className="form-note">{historyError}</p>:history.length?<ul className="compact-history">{history.slice(0,8).map((h,i)=><li key={i}><strong>{h.kind==="visite"?"Passage":h.kind==="recompense"?"Récompense":"Retour privé"}</strong><span>{displayDate(h.created_at)}</span>{h.detail&&<small>{h.detail}</small>}</li>)}</ul>:<p className="form-note">Aucune opération disponible.</p>}</details></>}</section></div>}</div>;
}
function IconPlaceholder(){return <span className="empty-symbol" aria-hidden="true">✳</span>;}
export default function Page(){return <Suspense fallback={<p>Chargement de la caisse…</p>}><CashRegister/></Suspense>;}
