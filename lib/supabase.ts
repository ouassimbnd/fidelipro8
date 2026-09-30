import { createClient,type SupabaseClient } from '@supabase/supabase-js';
let instance:SupabaseClient|null=null;
export const configured=Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL&&process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
export function supabase(){if(!configured)throw new Error('Le service est momentanément indisponible. Réessayez plus tard.');if(!instance)instance=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});return instance;}
export function errorMessage(error:unknown){
 const item=error as {code?:string;message?:string}|null;
 const messages:Record<string,string>={PGRST202:'Une mise à jour du programme est nécessaire. Contactez le responsable de Fideli.',PGRST116:'Ces informations ne sont plus disponibles. Actualisez la page.', '42501':'Vous n’avez pas accès à ces informations. Reconnectez-vous au bon compte.', '23505':'Ces informations existent déjà. Actualisez la page pour les retrouver.', '23503':'Cette information n’est plus disponible. Actualisez votre espace.', '22P02':'Ce lien ou cet identifiant n’est pas valide. Vérifiez le QR auprès du commerçant.',over_email_send_rate_limit:'Patientez une minute avant de demander un nouveau lien de connexion.',invalid_credentials:'L’email ou le mot de passe n’est pas correct.'};
 if(item?.code&&messages[item.code])return messages[item.code];
 const message=typeof item?.message==='string'?item.message:'Une erreur est survenue. Réessayez.';
 if(/failed to fetch|network|fetch failed/i.test(message))return 'La connexion au service a été interrompue. Vérifiez votre connexion et réessayez.';
 return message;
}
