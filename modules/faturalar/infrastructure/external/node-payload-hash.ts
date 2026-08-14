import { createHash } from "node:crypto";
import type { PayloadHashPort } from "../../application/webhook-service";

export class NodePayloadHash implements PayloadHashPort {
  sha256(value: Uint8Array): string { return createHash("sha256").update(value).digest("hex"); }
}
