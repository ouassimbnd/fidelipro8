"use client";
import { useEffect,useState } from 'react';
let pending:Promise<string>|null=null;
export function getPublicOrigin():Promise<string>{
 if(!pending)pending=fetch('/api/public-config',{cache:'no-store'}).then(async r=>{
  if(!r.ok)throw new Error('L’adresse publique est temporairement indisponible.');
  const data=await r.json();if(data.origin)return String(data.origin);
  if(['localhost','127.0.0.1','[::1]'].includes(location.hostname))return location.origin;
  throw new Error('L’adresse publique du programme n’est pas disponible. Le commerce doit vérifier sa configuration.');
 }).catch(error=>{pending=null;throw error;});return pending;
}
export function usePublicOrigin(){const [origin,setOrigin]=useState('');const [error,setError]=useState('');useEffect(()=>{let active=true;getPublicOrigin().then(value=>{if(active)setOrigin(value);}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};},[]);return {origin,error};}
