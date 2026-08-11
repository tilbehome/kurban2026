import { NextResponse, type NextRequest } from "next/server";
import { isAllowedPlatformAdminHost } from "./src/host-policy";

export function proxy(request: NextRequest): NextResponse {
  if (!isAllowedPlatformAdminHost(request.headers.get("host"))) {
    return new NextResponse("Platform Admin hostu reddedildi.", { status: 421 });
  }
  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
