export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { registerNodeObservability } = await import("@tilbecore/observability/node");
    await registerNodeObservability();
  }
}
