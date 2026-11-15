export type MacArchitecture = "Apple Silicon" | "Intel";

// MacIntel and the user-agent's Intel token also occur on Apple Silicon.
export function macArchitectureFromSignals(architecture = "", renderer = ""): MacArchitecture | null {
  if (/^(arm|arm64|aarch64)$/i.test(architecture)) return "Apple Silicon";
  if (/^(x86|x86_64|x64|amd64)$/i.test(architecture)) return "Intel";
  if (/Apple\s+(?:M\d|GPU)/i.test(renderer)) return "Apple Silicon";
  if (/Intel|AMD|ATI|Radeon|NVIDIA|GeForce/i.test(renderer)) return "Intel";
  return null;
}

export async function detectMacArchitecture(): Promise<MacArchitecture | null> {
  const device = navigator as Navigator & { userAgentData?: { getHighEntropyValues?: (keys: string[]) => Promise<{ architecture?: string }> } };
  try {
    const hints = await Promise.race([
      device.userAgentData?.getHighEntropyValues?.(["architecture"]),
      new Promise<undefined>(resolve => setTimeout(resolve, 1500)),
    ]);
    const arch = macArchitectureFromSignals(hints?.architecture);
    if (arch) return arch;
  } catch { /* Client hints may be denied by the browser. */ }
  let gl: WebGLRenderingContext | null = null;
  try {
    gl = document.createElement("canvas").getContext("webgl");
    const info = gl?.getExtension("WEBGL_debug_renderer_info");
    return info ? macArchitectureFromSignals("", String(gl!.getParameter(info.UNMASKED_RENDERER_WEBGL))) : null;
  } catch { return null; }
  finally { gl?.getExtension("WEBGL_lose_context")?.loseContext(); }
}
