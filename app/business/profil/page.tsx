"use client";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { commerceTypes } from "@/lib/commerce";
import { usePublicOrigin } from "@/lib/use-public-origin";
import { LoadingState,ErrorState } from "@/components/states";
import Link from "next/link";
import { configured, supabase, errorMessage } from "@/lib/supabase";
type Business = { id: string; name: string; slug: string; category: string | null; address: string | null; description: string | null; phone: string | null; hours: string | null; logo_emoji: string | null; accent_color: string | null };
export default function Profil() {
  const {origin,error:originError}=usePublicOrigin();
  const [business, setBusiness] = useState<Business | null>(null);
  const [form, setForm] = useState({ name: "", category: "", address: "", description: "", phone: "", hours: "", logo_emoji: "", accent_color: "#214e3e" });
  const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(false); const [message, setMessage] = useState("");
  const load = useCallback(async () => {
    if (!configured) { setLoading(false); return; }
    try {
      const client = supabase(); const { data: { user } } = await client.auth.getUser();
      if (!user) { location.replace("/business/login"); return; }
      const { data: b, error } = await client.from("businesses").select("id,name,slug,category,address,description,phone,hours,logo_emoji,accent_color").eq("owner_id", user.id).maybeSingle();
      if (error) throw error; if (!b) { location.replace("/business/new"); return; }
      setBusiness(b);
      setForm({ name: b.name || "", category: b.category || "", address: b.address || "", description: b.description || "", phone: b.phone || "", hours: b.hours || "", logo_emoji: b.logo_emoji || "", accent_color: b.accent_color || "#214e3e" });
    } catch (e) { setMessage(errorMessage(e)); } finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const submit = async (e: FormEvent) => {
    e.preventDefault(); if (!business || busy) return; setBusy(true); setMessage("");
    try {
      const { error } = await supabase().from("businesses").update({
        name: form.name.trim(), category: form.category.trim() || null, address: form.address.trim() || null,
        description: form.description.trim() || null, phone: form.phone.trim() || null, hours: form.hours.trim() || null,
        logo_emoji: form.logo_emoji.trim() || null, accent_color: form.accent_color || null,
      }).eq("id", business.id).select("id").single();
      if (error) throw error;
      setMessage("Profil mis à jour."); void load();
    } catch (e) { setMessage(errorMessage(e)); } finally { setBusy(false); }
  };
  if (!configured) return <div className="container page"><h1>Configuration requise</h1></div>;
  if (loading) return <LoadingState label="Chargement de votre établissement…"/>;
  if (!business) return <ErrorState message={message||"Votre établissement n’est pas disponible."} onRetry={()=>void load()}/>;
  return <div className="container page narrow auth-card">
    <div className="dashboard-header"><div><span className="kicker">ESPACE COMMERÇANT</span><h1>Mon établissement<span className="brand-period">.</span></h1><p>Ces informations sont visibles par vos clients sur votre page d’adhésion.</p></div><Link className="button outline" href="/business">← Tableau de bord</Link></div>
    {message && <p className="app-message" role="status">{message}</p>}
    <form onSubmit={submit}>
      <label>Nom du commerce<input required minLength={2} maxLength={80} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}/></label>
      <label>Activité<select value={form.category||"Autre commerce"} onChange={e=>setForm({...form,category:e.target.value})}>{form.category&&!commerceTypes.some(t=>t.name===form.category)&&<option value={form.category}>{form.category}</option>}{commerceTypes.map(t=><option key={t.id} value={t.name}>{t.name}</option>)}</select></label>
      <label>Adresse<input maxLength={160} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}/></label>
      <label>Téléphone<input type="tel" autoComplete="tel" maxLength={30} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}/></label>
      <label>Horaires<textarea rows={3} maxLength={400} value={form.hours} onChange={e => setForm({ ...form, hours: e.target.value })} placeholder="Lun–Ven 9h–19h, Sam 9h–13h"/></label>
      <label>Description<textarea rows={4} maxLength={600} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Présentez votre établissement en quelques phrases."/></label>
      <label>Emoji ou initiale affichée comme logo<input maxLength={8} value={form.logo_emoji} onChange={e => setForm({ ...form, logo_emoji: e.target.value })} placeholder="☕"/></label>
      <label>Couleur d’accent<input type="color" value={form.accent_color} onChange={e => setForm({ ...form, accent_color: e.target.value })}/></label>
      <p className="form-note">L’emoji ou l’initiale personnalise votre page d’inscription. La couleur d’accent appartient à votre identité de commerce.</p>
      <button className="button dark" disabled={busy}>Enregistrer</button>
    </form>
    <section className="public-link-card"><span className="kicker">VOTRE PAGE CLIENT</span><h2>Vérifiez votre vitrine.</h2><p>Votre identité, vos horaires et votre programme sont présentés avant l’inscription.</p>{origin?<a className="button outline" href={`${origin}/join/${business.slug}`} target="_blank" rel="noopener noreferrer">Voir la page publique ↗</a>:<p className="form-note">{originError||"Préparation du lien public…"}</p>}<p className="form-note">Identifiant permanent : {business.slug}. Il préserve les QR déjà imprimés.</p></section>

  </div>;
}
