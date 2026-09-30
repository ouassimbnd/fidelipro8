"use client";
import { useEffect, useRef, useState } from "react";
import { safeNext } from "@/lib/public-origin";
import Link from "next/link";
import { supabase, errorMessage } from "@/lib/supabase";
export default function AuthCallback() {
  const running=useRef(false);
  const [message,setMessage] = useState("Vérification de votre lien…");
  useEffect(() => { if(running.current)return;running.current=true;const run = async () => { try {
    const query = new URLSearchParams(location.search);
    const code = query.get("code");
    if (code) { const { error } = await supabase().auth.exchangeCodeForSession(code); if (error) throw error; }
    const { data: { user }, error } = await supabase().auth.getUser();
    if (error || !user) throw error || new Error("Lien expiré. Demandez un nouveau lien.");
    const next = query.get("next") || "/customer";
    location.replace(safeNext(next));
  } catch (error) { setMessage(errorMessage(error)); } }; void run(); }, []);
  return <div className="container page narrow"><h1>Connexion</h1><p role="status">{message}</p><Link className="button outline" href="/customer/login">Demander un nouveau lien</Link></div>;
}
