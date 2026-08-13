const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

export function configuredCorsOrigins(value: string): Set<string> {
  return new Set(value.split(",").map((origin) => origin.trim()).filter((origin) => {
    try {
      const parsed = new URL(origin);
      return parsed.protocol === "https:" || parsed.protocol === "http:";
    } catch {
      return false;
    }
  }));
}

/**
 * Allows explicitly configured origins and the paired 8081 preview host for a
 * 3000 API host. It never reflects arbitrary requesting origins.
 */
export function resolveAllowedCorsOrigin(
  origin: string | undefined,
  requestHostname: string,
  allowedOrigins: Set<string>,
): string | null {
  if (!origin) return null;
  let parsedOrigin: URL;
  try {
    parsedOrigin = new URL(origin);
  } catch {
    return null;
  }
  if (parsedOrigin.protocol !== "https:" && parsedOrigin.protocol !== "http:") return null;
  if (allowedOrigins.has(origin)) return origin;

  const originHostname = parsedOrigin.hostname.toLowerCase();
  const apiHostname = requestHostname.toLowerCase();
  if (originHostname === apiHostname) return origin;
  if (LOCAL_HOSTS.has(originHostname) && LOCAL_HOSTS.has(apiHostname)) return origin;

  const pairedPreviewHostname = apiHostname.replace(/^3000-/, "8081-");
  return pairedPreviewHostname !== apiHostname && originHostname === pairedPreviewHostname ? origin : null;
}
