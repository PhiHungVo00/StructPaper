export const DESKTOP_TITLEBAR_HEIGHT_PX = 38;

const EDITOR_ROUTE_PREFIXES = ['/editor', '/papers/editor'] as const;

/**
 * Determines whether the active Next.js pathname is an editor workspace route
 * that should display manuscript controls (AutoSave toggle, title, save status).
 */
export function isEditorTitleBarRoute(pathname?: string | null): boolean {
  if (!pathname) {
    return false;
  }

  return EDITOR_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}
