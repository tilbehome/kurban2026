import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { authenticatePlatformUser } from "@tilbecore/platform";
import { assertTrustedMutationRequest, mfaVerifier, passwordVerifier, platformCookieName, platformCookieOptions, platformRepository, safePlatformError } from "../../../../src/platform-server";
import { formObject } from "../../../../src/http";

const schema=z.object({email:z.string().email().max(254),password:z.string().min(1).max(256),mfaCode:z.string().regex(/^\d{6}$/)});
export async function POST(request:NextRequest){try{const {requestId}=await assertTrustedMutationRequest();const input=schema.parse(formObject(await request.formData()));const result=await authenticatePlatformUser(platformRepository(),passwordVerifier,mfaVerifier,{...input,requestId,userAgent:request.headers.get("user-agent")??undefined,occurredAt:new Date().toISOString()});const response=NextResponse.redirect(new URL("/",request.url),303);response.cookies.set(platformCookieName(),result.token,platformCookieOptions(result.session.expiresAt));return response}catch(error){const safe=safePlatformError(error);const url=new URL("/login",request.url);url.searchParams.set("error",safe.code);return NextResponse.redirect(url,303)}}
