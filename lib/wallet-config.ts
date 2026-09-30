import { canonicalOrigin } from './public-origin';
export function walletConfigured(){return Boolean(canonicalOrigin())&&['APPLE_PASS_TYPE_IDENTIFIER','APPLE_TEAM_IDENTIFIER','APPLE_SIGNER_CERT_BASE64','APPLE_SIGNER_KEY_BASE64','APPLE_WWDR_CERT_BASE64'].every(key=>Boolean(process.env[key]));}
