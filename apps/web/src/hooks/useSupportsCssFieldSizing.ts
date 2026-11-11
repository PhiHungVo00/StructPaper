/**
 * Detects native CSS `field-sizing: content` support at runtime.
 *
 * When supported (Chromium 123+, WebView2), textareas auto-size via CSS
 * `[field-sizing:content]`, avoiding synchronous `scrollHeight` reads and
 * forced layout reflows on mount, input, and window resize.
 */
export function supportsCssFieldSizing(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof CSS !== 'undefined' &&
    typeof CSS.supports === 'function' &&
    CSS.supports('field-sizing', 'content')
  );
}
