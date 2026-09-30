/** Canonical public links must never inherit a preview deployment URL. */
export function normalizeOrigin(value: string): string {
 const url=new URL(value);
 if(url.username||url.password||url.search||url.hash||!['https:','http:'].includes(url.protocol))throw new Error("Adresse publique invalide.");
 const local=['localhost','127.0.0.1','[::1]'].includes(url.hostname);
 if(url.protocol!=='https:'&&!local)throw new Error("L’adresse publique doit utiliser HTTPS.");
 if(url.pathname!=='/'&&url.pathname!=='')throw new Error("Renseignez uniquement le domaine, sans chemin.");
 return url.origin;
}
export function canonicalOrigin(): string | null {
 const configured=process.env.APP_URL||process.env.NEXT_PUBLIC_APP_URL;
 if(configured){try{return normalizeOrigin(configured);}catch{return null;}}
 const production=process.env.VERCEL_PROJECT_PRODUCTION_URL;
 if(production){try{return normalizeOrigin(`https://${production}`);}catch{return null;}}
 return null;
}
export function safeNext(value: string | null, fallback='/customer'):string {
 if(!value||!value.startsWith('/')||value.startsWith('//')||/[\\\u0000-\u001f]/.test(value))return fallback;
 try{const url=new URL(value,'https://fideli.invalid');if(url.origin!=='https://fideli.invalid')return fallback;return url.pathname+url.search+url.hash;}catch{return fallback;}
}
export function membershipFromScan(value:string):string|null {
 const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
 let id=value.trim();try{id=new URL(id).searchParams.get('membership')||id;}catch{}
 return uuid.test(id)?id:null;
}
