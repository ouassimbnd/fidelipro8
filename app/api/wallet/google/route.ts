import { NextRequest,NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { googleWalletConfigured,createGoogleWalletLink } from '@/lib/google-wallet';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store','Vary':'Authorization'};
const fail=(error:string,status:number)=>NextResponse.json({error},{status,headers});
export async function GET(){return NextResponse.json({configured:googleWalletConfigured()},{headers});}
export async function POST(request:NextRequest){
 const token=request.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1];if(!token)return fail('Connectez-vous pour ajouter votre carte.',401);
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;if(!url||!key)return fail('Service indisponible.',503);
 let body:unknown;try{body=await request.json();}catch{return fail('Demande invalide.',400);}
 const id=(body as {membershipId?:unknown})?.membershipId;if(typeof id!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))return fail('Carte invalide.',400);
 try{
  const c=createClient(url,key,{global:{headers:{Authorization:`Bearer ${token}`}},auth:{persistSession:false,autoRefreshToken:false}});
  const {data:{user},error:ae}=await c.auth.getUser(token);if(ae||!user)return fail('Votre session a expiré. Reconnectez-vous.',401);
  const {data:customer,error:ce}=await c.from('customers').select('id,display_name').eq('auth_user_id',user.id).maybeSingle();if(ce)throw ce;if(!customer)return fail('Carte introuvable.',404);
  const {data:m,error:me}=await c.from('memberships').select('id,program:programs(business:businesses(name))').eq('id',id).eq('customer_id',customer.id).maybeSingle();if(me)throw me;if(!m)return fail('Carte introuvable.',404);
  if(!googleWalletConfigured())return fail('Google Wallet n’est pas encore activé par Fideli.',503);
  const program=m.program as unknown as {business:{name:string}}|null;if(!program?.business)return fail('Ce programme n’est plus disponible.',404);
  const saveUrl=createGoogleWalletLink({membershipId:m.id,customerName:customer.display_name,businessName:program.business.name});return NextResponse.json({url:saveUrl},{headers});
 }catch{return fail('Impossible de préparer votre carte. Réessayez ou contactez Fideli.',500);}
}
