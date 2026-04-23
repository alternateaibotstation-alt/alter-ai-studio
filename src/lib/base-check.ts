/**
 * Runtime check: warns in production if Vite's configured `base` does not
 * match where the app is actually served from. A mismatch causes assets to
 * 404 and client-side routes to break (blank screen on refresh).
 *
 * Vite injects `import.meta.env.BASE_URL` at build time from `vite.config.ts`'s
 * `base` field. In Lovable, this should always be "/".
 */
export function verifyDeploymentBase(): void {
  if (import.meta.env.DEV) return;

  const configuredBase = import.meta.env.BASE_URL || "/";
  const { pathname } = window.location;

  // If base is "/", any pathname is valid. If base is "/sub/", every URL
  // should start with "/sub/". Detect the obvious mismatch.
  if (configuredBase !== "/" && !pathname.startsWith(configuredBase)) {
    // eslint-disable-next-line no-console
    console.error(
      `[deployment] Base path mismatch: Vite was built with base="${configuredBase}" ` +
        `but the app is served from "${pathname}". Assets and routes may fail to load. ` +
        `Set base to "/" in vite.config.ts for root-served deployments.`
    );
  }

  // Probe: confirm at least one built asset is reachable. If the script tag
  // that loaded this module has a src that doesn't match BASE_URL, warn.
  const scripts = Array.from(document.scripts);
  const appScript = scripts.find((s) => s.src.includes("/assets/"));
  if (appScript && configuredBase !== "/") {
    const url = new URL(appScript.src);
    if (!url.pathname.startsWith(configuredBase)) {
      // eslint-disable-next-line no-console
      console.warn(
        `[deployment] Asset "${url.pathname}" does not match configured base "${configuredBase}".`
      );
    }
  }
}
