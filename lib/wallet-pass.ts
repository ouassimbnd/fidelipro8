import { canonicalOrigin } from "./public-origin";
import { PKPass } from "passkit-generator";
import { walletIcons } from "./wallet-icons";
export type WalletIdentity = { membershipId: string; customerName: string; businessName: string };
export function createWalletPass(identity:WalletIdentity){
 const origin=new URL(canonicalOrigin()!);
 if(origin.protocol!=="https:")throw new Error("APP_URL must use HTTPS");
 const pass=new PKPass(Object.fromEntries(Object.entries(walletIcons).map(([name,base64])=>[name,Buffer.from(base64,"base64")])),{
  signerCert:Buffer.from(process.env.APPLE_SIGNER_CERT_BASE64!,"base64"),
  signerKey:Buffer.from(process.env.APPLE_SIGNER_KEY_BASE64!,"base64"),
  signerKeyPassphrase:process.env.APPLE_SIGNER_KEY_PASSPHRASE,
  wwdr:Buffer.from(process.env.APPLE_WWDR_CERT_BASE64!,"base64"),
 },{
  serialNumber:identity.membershipId,passTypeIdentifier:process.env.APPLE_PASS_TYPE_IDENTIFIER!,
  teamIdentifier:process.env.APPLE_TEAM_IDENTIFIER!,organizationName:"Fideli",
  description:`Carte de fidélité ${identity.businessName}`,logoText:identity.businessName,
  backgroundColor:"rgb(33, 78, 62)",foregroundColor:"rgb(255, 255, 255)",labelColor:"rgb(214, 233, 183)",
 });
 pass.type="storeCard";
 pass.primaryFields.push({key:"member",label:"CARTE DE FIDÉLITÉ",value:identity.customerName});
 pass.secondaryFields.push({key:"instructions",label:"À CHAQUE VISITE",value:"Présentez ce QR en caisse"});
 pass.backFields.push({key:"balance",label:"Mes points et récompenses",value:new URL(`/customer?membership=${identity.membershipId}`,origin).href},
 {key:"help",label:"Comment utiliser ma carte",value:"Présentez le QR au commerçant. Les points et les récompenses sont consultables dans votre espace Fideli. Cette carte ne contient pas de solde et ne se met pas à jour automatiquement."});
 // An identifier, never a credential: the cashier must authenticate and own this membership's business.
 pass.setBarcodes({format:"PKBarcodeFormatQR",message:new URL(`/business/caisse?membership=${identity.membershipId}`,origin).href,messageEncoding:"iso-8859-1",altText:"À présenter en caisse"});
 return pass.getAsBuffer();
}
