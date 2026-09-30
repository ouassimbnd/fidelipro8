import { NextResponse } from 'next/server';
import { canonicalOrigin } from '@/lib/public-origin';
export const dynamic='force-dynamic';
export async function GET(){return NextResponse.json({origin:canonicalOrigin()},{headers:{'Cache-Control':'no-store'}});}
