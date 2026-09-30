"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Header, Footer } from "./ui";
import { configured, supabase } from "@/lib/supabase";
const links = [
  ["/business", "Vue d’ensemble", "overview"], ["/business/caisse", "Caisse", "cash"],
  ["/business/clients", "Clients", "people"], ["/business/campagnes", "Campagnes", "send"], ["/business/programme", "Récompenses", "gift"],
  ["/business/cartes", "Cartes & invitations", "card"], ["/business/equipe", "Équipe", "people"],
  ["/business/profil", "Mon établissement", "store"], ["/business/wallet", "Cartes Wallet", "card"],
];
export function Icon({name}: {name: string}) {
 const paths: Record<string,string> = {overview:"M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",cash:"M4 3h16v18H4z M7 6h10v4H7z M7 14h1m3 0h1m3 0h1M7 17h1m3 0h1m3 0h1",people:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M22 21v-2a4 4 0 0 0-3-3.87 M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M17 3a4 4 0 0 1 0 8",gift:"M3 8h18v4H3z M5 12v9h14v-9 M12 8v13 M12 8C2 8 7 0 12 8c5-8 10 0 0 0",card:"M3 5h18v14H3z M3 10h18 M6 15h4",store:"M3 10h18l-2-7H5z M5 10v11h14V10 M9 21v-7h6v7",send:"M22 2 11 13 M22 2 15 22 11 13 2 9 22 2"};
 return <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name] || paths.card}/></svg>;
}
export function AppShell({children}: {children: React.ReactNode}) {
 const path = usePathname(); const [open,setOpen]=useState(false); const [error,setError]=useState("");
 const merchant = path.startsWith("/business") && !["/business/login","/business/new","/business/forgot-password","/business/reset-password"].includes(path);
 const customer = path.startsWith("/customer") || path.startsWith("/join/") || path.startsWith("/card/");
 const logout = async()=>{try {if(configured){const {error}=await supabase().auth.signOut();if(error)throw error;}location.assign("/business/login");}catch{setError("Déconnexion impossible. Réessayez.");}};
 if (!merchant && !customer) return <><Header/><main id="main-content">{children}</main><Footer/></>;
 if(customer) return <div className="client-shell"><header className="client-top"><Link className="brand" href={path.startsWith("/customer") ? "/customer" : "/"}>fideli<span>.</span></Link><span>{path.startsWith("/customer") ? "Mon espace fidélité" : "Votre carte de fidélité"}</span><Link href="/privacy">Confidentialité</Link></header><main id="main-content">{children}</main></div>;
 const title=links.find(([href])=>href===path)?.[1] || "Mon espace";
 return <div className="workspace"><a className="skip-link" href="#main-content">Aller au contenu</a>
 <aside className={`app-sidebar ${open?"is-open":""}`}><Link className="brand" href="/business" onClick={()=>setOpen(false)}><span className="brand-mark">f</span>fideli<span className="brand-period">.</span></Link><div className="workspace-label">ESPACE COMMERÇANT</div><nav aria-label="Gestion du commerce">{links.map(([href,label,icon])=><Link key={href} href={href} className={path===href?"active":""} aria-current={path===href?"page":undefined} onClick={()=>setOpen(false)}><Icon name={icon}/>{label}</Link>)}</nav><div className="sidebar-bottom"><div className="sidebar-tip"><strong>Un passage. Un lien durable.</strong><p>Tout pour faire revenir vos clients.</p></div><button onClick={logout}>Se déconnecter <span aria-hidden>↗</span></button>{error&&<p role="alert">{error}</p>}<Link href="/">Voir le site Fideli</Link></div></aside>
 {open&&<button className="nav-backdrop" aria-label="Fermer le menu" onClick={()=>setOpen(false)}/>}
 <div className="workspace-body"><header className="app-topbar"><button className="menu-toggle" aria-label="Ouvrir la navigation" aria-expanded={open} onClick={()=>setOpen(!open)}>☰</button><div><span className="breadcrumb">Mon commerce <span>/</span></span> {title}</div><Link className="topbar-cash" href="/business/caisse"><Icon name="cash"/> Ouvrir la caisse</Link></header><main id="main-content">{children}</main><footer className="app-footer">Fideli · La fidélité, simplement. <Link href="/privacy">Confidentialité</Link></footer></div></div>;
}
