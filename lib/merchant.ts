import type { SupabaseClient } from '@supabase/supabase-js';
export type MerchantRole='owner'|'manager'|'cashier';
export async function merchantContext(client:SupabaseClient){
 const {data:{user},error:ue}=await client.auth.getUser(); if(ue) throw ue; if(!user)return null;
 const own=await client.from('businesses').select('id,name,slug,category').eq('owner_id',user.id).maybeSingle(); if(own.error)throw own.error;
 if(own.data)return {user,business:own.data,role:'owner' as MerchantRole};
 const member=await client.from('business_members').select('business_id,role').eq('user_id',user.id).eq('active',true).maybeSingle();
 if(member.error)throw member.error;if(!member.data)return null;
 const b=await client.from('businesses').select('id,name,slug,category').eq('id',member.data.business_id).single();if(b.error)throw b.error;
 return {user,business:b.data,role:member.data.role as MerchantRole};
}
export const canManage=(role:MerchantRole)=>role==='owner'||role==='manager';
