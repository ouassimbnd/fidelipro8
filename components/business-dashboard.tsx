"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePublicOrigin } from "@/lib/use-public-origin";
import { cardStatus,commerceFor } from "@/lib/commerce";
import { LoadingState,ErrorState } from "@/components/states";
import { QRCodeSVG } from "qrcode.react";
import { configured, supabase, errorMessage } from "@/lib/supabase";
type Business = { id: string; name: string; slug: string; category: string | null };
type Program = { id: string; reward_name: string; required_visits: number };
type Member = { id: string; name: string; visits: number; redeemed: number; points: number };
type Overview = { clients: number; visits: number; redemptions: number; members: Member[] };
type Card = { id: string; token: string; status: string };
type Reward = { id: string; name: string; points_cost: number };
type HistoryItem = { kind: string; created_at: string; detail: string | null };

export default function Business({ view = "overview" }: { view?: "overview" | "clients" | "cards" }) {
  const requestId = useRef(0);
  const historyRequest = useRef(0);
  const actionLock = useRef(false);
  const [issuing, setIssuing] = useState(false);
  const [query, setQuery] = useState("");
  const [business, setBusiness] = useState<Business | null>(null);
  const [program, setProgram] = useState<Program | null>(null);
  const [overview, setOverview] = useState<Overview>({ clients: 0, visits: 0, redemptions: 0, members: [] });
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState("");
  const [busyMember, setBusyMember] = useState("");
  const [cardOffset,setCardOffset]=useState(0);
  const [cardCount,setCardCount]=useState(0);
  const [cards, setCards] = useState<Card[]>([]);
  const {origin,error:originError} = usePublicOrigin();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [cashiers, setCashiers] = useState<{ id: string; name: string }[]>([]);
  const [cashier, setCashier] = useState("");
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [selectedReward, setSelectedReward] = useState("");
  const [openHistory, setOpenHistory] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const load = useCallback(async () => {
    const currentRequest = ++requestId.current;
    if (!configured) { setLoading(false); return; }
    try {
      const client = supabase();
      const { data: { user } } = await client.auth.getUser();
      if (!user) { location.replace(`/business/login?next=${encodeURIComponent(location.pathname+location.search)}`); return; }
      const { data: b, error } = await client.from("businesses").select("id,name,slug,category").eq("owner_id", user.id).maybeSingle();
      if (error) throw error; if (!b) { location.replace("/business/new"); return; }
      setBusiness(b);
      const { data: p, error: pe } = await client.from("programs").select("id,reward_name,required_visits").eq("business_id", b.id).eq("active", true).maybeSingle();
      if (pe) throw pe; setProgram(p); if (!p) { setLoading(false); return; }
      const [summary, car, cash, rew] = await Promise.all([
        client.rpc("business_overview", { p_business: b.id, p_offset: offset, p_search: search || null }),
        client.from("physical_cards").select("id,token,status", {count:"exact"}).eq("business_id", b.id).order("created_at", { ascending: false }).range(cardOffset,cardOffset+19),
        client.from("cashiers").select("id,name").eq("business_id", b.id).eq("active", true).order("name"),
        client.from("rewards").select("id,name,points_cost").eq("program_id", p.id).eq("active", true).order("points_cost"),
      ]);
      if (currentRequest !== requestId.current) return;
      if (summary.error || car.error || cash.error || rew.error) throw summary.error || car.error || cash.error || rew.error;
      setOverview(summary.data as Overview); setCards(car.data || []); setCardCount(car.count || 0); setCashiers(cash.data || []);
      setRewards((rew.data || []) as Reward[]);
      setLoading(false);
    } catch (error) { setMessage(errorMessage(error)); setLoading(false); }
  }, [offset, search,cardOffset]);
  useEffect(() => { const timer=setTimeout(()=>{setSearch(query);setOffset(0);},250);return ()=>clearTimeout(timer); }, [query]);
  useEffect(() => { void load(); }, [load]);

  const act = async (kind: "visit" | "redeem", id: string) => {
    if (actionLock.current) return;
    if (kind === "redeem") {
      const reward = rewards.find(r => r.id === selectedReward);
      if (!reward) { setMessage("Choisissez d’abord une récompense dans la liste."); return; }
      if (!confirm(`Donner « ${reward.name} » à ce client pour ${reward.points_cost} points ?`)) return;
    }
    actionLock.current = true; setBusyMember(id); setMessage("");
    try {
    const { error } = kind === "visit"
      ? await supabase().rpc("record_visit", { p_membership: id, p_cashier: cashier || null })
      : await supabase().rpc("redeem_reward", { p_membership: id, p_reward: selectedReward });
    setMessage(error ? errorMessage(error) : kind === "visit" ? "Visite enregistrée." : "Récompense donnée.");
    if (!error) await load();
    } catch(error) { setMessage(errorMessage(error)); } finally { actionLock.current = false; setBusyMember(""); }
  };
  const issue = async () => {
    if (!business || issuing) return;
    setIssuing(true);
    try {
      const { error } = await supabase().rpc("issue_card", { p_business: business.id });
      if(error) throw error;
      setMessage("Carte créée. Téléchargez son QR code pour l’imprimer."); await load();
    } catch(error) { setMessage(errorMessage(error)); } finally { setIssuing(false); }
  };
  const copy = async (url: string) => { try { await navigator.clipboard.writeText(url); setMessage("Lien copié."); } catch { setMessage("Copiez le lien affiché."); } };
  const downloadQr = (token: string) => {
    const svg = document.getElementById(`card-qr-${token}`);
    if (!svg) { setMessage("QR indisponible. Réessayez après chargement."); return; }
    const xml = new XMLSerializer().serializeToString(svg);
    const url = URL.createObjectURL(new Blob([xml], { type: "image/svg+xml;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = `fideli-carte-${token}.svg`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  };
  const toggleHistory = async (id: string) => {
    const sequence=++historyRequest.current;
    if (openHistory === id) { setOpenHistory(""); return; }
    setOpenHistory(id); setHistoryLoading(true); setHistory([]);
    try {
      const { data, error } = await supabase().rpc("member_history", { p_membership: id });
      if(sequence!==historyRequest.current)return;
      if(error)throw error;setHistory((data || []) as HistoryItem[]);
    }catch(error){if(sequence===historyRequest.current)setMessage(errorMessage(error));}
    finally{if(sequence===historyRequest.current)setHistoryLoading(false);}
  };

  if (!configured) return <div className="container page"><h1>Configuration requise</h1><p>Ajoutez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY dans Vercel.</p></div>;
  if (loading) return <LoadingState label="Préparation de votre commerce…"/>;
  if (!business) return <ErrorState message={message||"Votre établissement n’a pas encore été créé."} onRetry={()=>void load()}/>;
  if (!program) return <ErrorState message="Votre établissement n’a pas de programme actif. Contactez Fideli pour le réactiver." onRetry={()=>void load()}/>;

  const sector=commerceFor(business.category);
  const joinUrl = `${origin}/join/${business.slug}`;
  const fmt = (d: string) => new Date(d).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  return <div className="container page dashboard">
    <div className="dashboard-header"><div><span className="kicker">{business.name}</span><h1>{view === "overview" ? "Votre activité, en un regard." : view === "clients" ? "Vos clients fidèles." : "Faites grandir votre communauté."}</h1><p>{view === "overview" ? "Suivez votre programme et préparez la prochaine visite." : view === "clients" ? "Retrouvez les points, les visites et l’historique de chaque client." : "Invitez vos clients et gérez vos cartes physiques."}</p></div><div className="panel-actions"><button className="button outline" onClick={() => void load()}>Actualiser</button><Link className="button dark" href="/business/caisse">+ Enregistrer une visite</Link></div></div>
    {message && <p className="app-message" role="status">{message}</p>}
    {originError && view === "cards" && <p className="app-message warning" role="alert">{originError} Renseignez APP_URL avec votre domaine public dans Vercel. Les QR sont masqués pour éviter un lien inaccessible.</p>}
    {view === "overview" && <>
    <div className="stats">
      <div className="stat"><span>CLIENTS INSCRITS</span><strong>{overview.clients}</strong><small>Dans votre programme</small></div>
      <div className="stat"><span>VISITES ENREGISTRÉES</span><strong>{overview.visits}</strong><small>Tous vos clients</small></div>
      <div className="stat"><span>RÉCOMPENSES DONNÉES</span><strong>{overview.redemptions}</strong><small>Depuis le lancement</small></div>
    </div>
    <section className="welcome-banner"><div><span className="kicker">CHAQUE VISITE COMPTE</span><h2>La prochaine bonne habitude<br/>commence chez vous.</h2><p>Chez vous, {sector.passage} rapporte 10 points. Un retour privé, 5 points.</p><Link className="button dark" href="/business/caisse">Accueillir un client →</Link></div><div className="banner-emblem" aria-hidden="true">✳</div></section>
    <div className="quick-grid"><Link href="/business/clients"><span>01 / CLIENTS</span><h3>Retrouvez vos habitués ↗</h3><p>Soldes de points et historique des visites.</p></Link><Link href="/business/programme"><span>02 / RÉCOMPENSES</span><h3>Donnez envie de revenir ↗</h3><p>{rewards.length} récompense{rewards.length > 1 ? "s" : ""} dans votre catalogue.</p></Link><Link href="/business/cartes"><span>03 / INVITATIONS</span><h3>Partagez votre programme ↗</h3><p>Votre QR code d’inscription et vos cartes.</p></Link></div>
    {!overview.clients && <section className="panel"><span className="kicker">POUR BIEN DÉMARRER</span><h2>Bienvenue dans votre espace.</h2><p>Personnalisez votre établissement, vérifiez vos récompenses, puis partagez votre QR code avec votre premier client.</p><div className="panel-actions"><Link className="button outline" href="/business/profil">1. Mon établissement</Link><Link className="button outline" href="/business/programme">2. Mes récompenses</Link><Link className="button dark" href="/business/cartes">3. Inviter un client</Link></div></section>}
    </>}
    {view === "clients" && <div className="dashboard-grid clients-only">

      <section className="panel">
        <span className="kicker">VOS CLIENTS</span><h2>Clients et avantages</h2>
        <input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Rechercher un client par prénom…" aria-label="Rechercher un client" style={{ height: 44, border: "1px solid var(--line)", borderRadius: 9, padding: "0 14px", margin: "12px 0", width: "100%" }}/>
        <label className="caisse-select">Passage attribué à <select value={cashier} onChange={e => setCashier(e.target.value)}><option value="">Propriétaire</option>{cashiers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        <label className="caisse-select">Récompense à donner <select value={selectedReward} onChange={e => setSelectedReward(e.target.value)}><option value="">Choisir une récompense…</option>{rewards.map(r => <option key={r.id} value={r.id}>{r.name} — {r.points_cost} pts</option>)}</select></label>
        {!rewards.length && <p>Aucune récompense active. <Link href="/business/programme">Ajoutez-en une</Link> pour pouvoir en donner.</p>}
        {!overview.members.length ? <p>{search ? "Aucun client ne correspond à cette recherche." : "Pas encore de client. Partagez le QR code de votre programme."}</p> : <div className="member-list">{overview.members.map(m => <div key={m.id}>
          <div className="member-row"><div><strong>{m.name}</strong><p>{m.visits} passages · {m.points} points</p></div>
            <div className="panel-actions">
              <button className="button dark" disabled={Boolean(busyMember)} onClick={() => act("visit", m.id)}>+ Passage</button>
              <button className="button outline" disabled={Boolean(busyMember) || !selectedReward || m.points < (rewards.find(r => r.id === selectedReward)?.points_cost ?? Infinity)} onClick={() => act("redeem", m.id)}>Donner la récompense</button>
              <button className="text-switch" onClick={() => void toggleHistory(m.id)}>{openHistory === m.id ? "Masquer l’historique" : "Historique"}</button>
            </div></div>
          {openHistory === m.id && <div className="history-panel">
            {historyLoading ? <p>Chargement de l’historique…</p> : !history.length ? <p>Aucune opération enregistrée.</p> : <ul>{history.map((h, i) => <li key={i}><span className={`history-tag ${h.kind}`}>{h.kind === "visite" ? "Visite" : h.kind === "recompense" ? "Récompense" : "Avis"}</span> {fmt(h.created_at)}{h.detail ? ` · ${h.detail}` : ""}</li>)}</ul>}
          </div>}
        </div>)}</div>}
        {overview.clients > 25 && <div className="panel-actions page-controls"><button className="button outline" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - 25))}>← Précédents</button><span>{overview.members.length ? `${offset + 1}–${offset + overview.members.length}` : "Aucun résultat"}{!search && ` sur ${overview.clients}`}</span><button className="button outline" disabled={overview.members.length < 25 || (!search && offset + 25 >= overview.clients)} onClick={() => setOffset(offset + 25)}>Suivants →</button></div>}
      </section>
    </div>}
    {view === "cards" && <>
      <section className="panel qr-panel">
        <span className="kicker">PARTAGER LE PROGRAMME</span><h2>Votre QR code</h2>
        <p>Le lien dépend de l’identifiant public de votre commerce, et ouvre son inscription.</p>
        <div className="qr-frame">{origin ? <QRCodeSVG value={joinUrl} size={170} includeMargin/> : <p>QR disponible après configuration de l’adresse publique.</p>}</div>
        {origin && <div className="url-box">{joinUrl}</div>}
        <button className="button outline full" onClick={() => copy(joinUrl)} disabled={!origin}>Copier le lien ↗</button>
      </section>
    <section className="panel card-issue">
      <span className="kicker">CARTES PHYSIQUES</span><h2>Un QR unique par carte</h2>
      <p>Créez un QR code, imprimez-le sur une carte plastique ou verre. Le client le lie à son compte en le scannant. La perte et le remplacement sont gérés sans perdre ses points.</p>
      <button className="button dark" onClick={issue} disabled={issuing}>{issuing ? "Création…" : "Créer une carte"}</button>
      {!cards.length && <p className="empty-inline">Aucune carte physique créée. Vos clients peuvent déjà rejoindre le programme avec le QR ci-dessus.</p>}
      <div className="physical-grid">{cards.map(card => { const url = `${origin}/card/${card.token}`; return <div className="physical-card" key={card.id}><span>{cardStatus(card.status)}</span>{origin && ["active","unassigned"].includes(card.status) && <QRCodeSVG id={`card-qr-${card.token}`} value={url} size={126} includeMargin/>}<small>{card.token}</small>{["active","unassigned"].includes(card.status) ? <><button className="text-switch" disabled={!origin} onClick={() => copy(url)}>Copier le lien</button><button className="text-switch" disabled={!origin} onClick={() => downloadQr(card.token)}>Télécharger le QR (SVG)</button><Link href={`/card/${card.token}`}>Ouvrir la carte →</Link></> : <p className="form-note">Cette carte est désactivée. Ses points restent sur le compte du client.</p>}</div>; })}</div>
      {cardCount>20 && <div className="panel-actions page-controls"><button className="button outline" disabled={cardOffset===0} onClick={()=>setCardOffset(n=>Math.max(0,n-20))}>← Précédentes</button><span>{cardOffset+1}–{Math.min(cardOffset+20,cardCount)} sur {cardCount}</span><button className="button outline" disabled={cardOffset+20>=cardCount} onClick={()=>setCardOffset(n=>n+20)}>Suivantes →</button></div>}
    </section>
    </>}
  </div>;
}
