import { createSign } from 'node:crypto';
import { canonicalOrigin } from './public-origin';
import type { WalletIdentity } from './wallet-pass';
export function googleWalletConfigured(){return Boolean(canonicalOrigin()&&process.env.GOOGLE_WALLET_ISSUER_ID&&process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL&&process.env.GOOGLE_WALLET_PRIVATE_KEY_BASE64);}
export function createGoogleWalletLink(identity:WalletIdentity){
 const origin=canonicalOrigin();if(!origin)throw new Error('Adresse publique manquante.');
 const issuer=process.env.GOOGLE_WALLET_ISSUER_ID!;
 if(!/^\d+$/.test(issuer))throw new Error('Issuer ID invalide.');
 const classId=process.env.GOOGLE_WALLET_CLASS_ID||`${issuer}.fideli`;
 if(!classId.startsWith(`${issuer}.`))throw new Error('La classe ne correspond pas à l’émetteur.');
 const payload={iss:process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL!,aud:'google',typ:'savetowallet',iat:Math.floor(Date.now()/1000),origins:[origin],payload:{
  genericClasses:[{id:classId}],
  genericObjects:[{id:`${issuer}.${identity.membershipId}`,classId,state:'ACTIVE',hexBackgroundColor:'#214e3e',
   cardTitle:{defaultValue:{language:'fr-FR',value:'Fideli · '+identity.businessName}},
   header:{defaultValue:{language:'fr-FR',value:identity.customerName}},
   subheader:{defaultValue:{language:'fr-FR',value:'Votre carte de fidélité'}},
   barcode:{type:'QR_CODE',value:`${origin}/business/caisse?membership=${identity.membershipId}`,alternateText:'À présenter en caisse'},
   textModulesData:[{id:'how-to',header:'À chaque passage',body:'Présentez votre QR en caisse. Consultez vos points et récompenses dans votre espace Fideli.'}],
   linksModuleData:{uris:[{id:'customer',uri:`${origin}/customer?membership=${identity.membershipId}`,description:'Mes points et récompenses'}]},
  }],
 }};
 const encode=(value:unknown)=>Buffer.from(JSON.stringify(value)).toString('base64url');
 const unsigned=`${encode({alg:'RS256',typ:'JWT'})}.${encode(payload)}`;
 const signature=createSign('RSA-SHA256').update(unsigned).end().sign(Buffer.from(process.env.GOOGLE_WALLET_PRIVATE_KEY_BASE64!,'base64').toString('utf8')).toString('base64url');
 return `https://pay.google.com/gp/v/save/${unsigned}.${signature}`;
}
