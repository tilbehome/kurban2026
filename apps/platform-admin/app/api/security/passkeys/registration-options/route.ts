import { beginPasskeyRegistration } from "@tilbecore/platform";
import { mutationFailure, mutationSuccess } from "../../../../../src/http";
import { passkeyCeremony } from "../../../../../src/passkey";
import { assertTrustedMutationRequest, platformRepository, requirePlatformActor } from "../../../../../src/platform-server";
import type { NextRequest } from "next/server";
export async function POST(request:NextRequest){try{await assertTrustedMutationRequest();const actor=await requirePlatformActor("platform.security.manage");return mutationSuccess(request,"/security",await beginPasskeyRegistration(platformRepository(),passkeyCeremony,actor,new Date().toISOString()))}catch(error){return mutationFailure(request,error,"/security")}}
