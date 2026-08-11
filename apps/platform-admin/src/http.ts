import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { safePlatformError } from "./platform-server";

export function formObject(form: FormData): Record<string,string> {
  return Object.fromEntries([...form.entries()].map(([key,value]) => [key, typeof value === "string" ? value : ""]));
}

export function mutationSuccess(request: NextRequest, fallback: string, data?: unknown): NextResponse {
  const requestId=request.headers.get("x-request-id")??randomUUID();
  if (request.headers.get("accept")?.includes("application/json")) return NextResponse.json({ ok:true,requestId,data },{headers:{"x-request-id":requestId}});
  const referer=request.headers.get("referer"); return NextResponse.redirect(referer && sameOrigin(referer,request.url) ? referer : new URL(fallback,request.url),303);
}

export function mutationFailure(request: NextRequest,error:unknown,fallback:string):NextResponse{
  const safe=safePlatformError(error);const requestId=request.headers.get("x-request-id")??randomUUID();const messageKey=`platform.error.${safe.code.toLowerCase().replaceAll("_",".")}`;if(request.headers.get("accept")?.includes("application/json"))return NextResponse.json({ok:false,code:safe.code,messageKey,requestId},{status:safe.status,headers:{"x-request-id":requestId}});
  const url=new URL(fallback,request.url);url.searchParams.set("error",safe.code);return NextResponse.redirect(url,303);
}

function sameOrigin(left:string,right:string):boolean{try{return new URL(left).origin===new URL(right).origin}catch{return false}}
