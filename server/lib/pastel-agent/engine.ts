/**
 * Back-compat shim — the public engine entry points now delegate to the
 * stage orchestrator. Kept as a module so existing dynamic imports in the
 * route layer continue to resolve.
 */
export { runClarify } from "./stages/intake";
export { startAgentLoop, startScreenDeltaLoop } from "./orchestrator";
