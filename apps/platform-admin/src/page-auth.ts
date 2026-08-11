import { redirect } from "next/navigation";
import { requirePlatformActor } from "./platform-server";
import type { PlatformPermissionKey } from "@tilbecore/platform";

export async function pageActor(permission: PlatformPermissionKey) {
  try { return await requirePlatformActor(permission); } catch (error) {
    if (error instanceof Error && error.message === "PLATFORM_PERMISSION_DENIED") redirect("/unauthorized");
    redirect("/login");
  }
}
