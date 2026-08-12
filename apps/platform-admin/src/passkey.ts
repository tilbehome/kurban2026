import {
  generateAuthenticationOptions, generateRegistrationOptions,
  verifyAuthenticationResponse, verifyRegistrationResponse,
  type AuthenticationResponseJSON, type AuthenticatorTransportFuture, type RegistrationResponseJSON,
} from "@simplewebauthn/server";
import { createPlatformWebAuthnConfig } from "@tilbecore/config";
import type { PasskeyCeremonyPort } from "@tilbecore/platform";
import { platformDeploymentEnvironment } from "./host-policy";

const config = () => createPlatformWebAuthnConfig(platformDeploymentEnvironment());

export const passkeyCeremony: PasskeyCeremonyPort = {
  async registrationOptions(input) {
    const webauthn=config();
    return generateRegistrationOptions({
      rpName:webauthn.rpName,rpID:webauthn.rpId,userName:input.email,userDisplayName:input.displayName,
      userID:new TextEncoder().encode(input.userId),attestationType:"none",
      excludeCredentials:input.existingCredentialIds.map(id=>({id})),
      authenticatorSelection:{residentKey:"required",userVerification:"required"},
      supportedAlgorithmIDs:[-7,-257],
    }) as unknown as Readonly<Record<string,unknown>>;
  },
  async verifyRegistration(input) {
    const webauthn=config();
    const verification=await verifyRegistrationResponse({response:input.response as RegistrationResponseJSON,expectedChallenge:input.expectedChallenge,expectedOrigin:[...webauthn.allowedOrigins],expectedRPID:webauthn.rpId,requireUserVerification:true});
    if(!verification.verified||!verification.registrationInfo)throw new Error("PASSKEY_REGISTRATION_VERIFICATION_FAILED");
    const {credential,credentialDeviceType,credentialBackedUp}=verification.registrationInfo;
    return {credentialId:credential.id,publicKeyBase64url:Buffer.from(credential.publicKey).toString("base64url"),counter:BigInt(credential.counter),transports:credential.transports??[],deviceType:credentialDeviceType,backedUp:credentialBackedUp};
  },
  async authenticationOptions(input) {
    const webauthn=config();return generateAuthenticationOptions({rpID:webauthn.rpId,userVerification:"required",allowCredentials:input.credentialIds.map(id=>({id}))}) as unknown as Readonly<Record<string,unknown>>;
  },
  async verifyAuthentication(input) {
    const webauthn=config();const verification=await verifyAuthenticationResponse({response:input.response as AuthenticationResponseJSON,expectedChallenge:input.expectedChallenge,expectedOrigin:[...webauthn.allowedOrigins],expectedRPID:webauthn.rpId,requireUserVerification:true,credential:{id:input.credential.credentialId,publicKey:new Uint8Array(Buffer.from(input.credential.publicKeyBase64url,"base64url")),counter:Number(input.credential.counter),transports:input.credential.transports as AuthenticatorTransportFuture[]}});
    if(!verification.verified)throw new Error("PASSKEY_AUTHENTICATION_FAILED");return{credentialId:input.credential.credentialId,newCounter:BigInt(verification.authenticationInfo.newCounter)};
  },
};
