/**
 * XML Node AST traversal utilities for fast-xml-parser with preserveOrder: true
 */

export type FxpNode = {
  [tagName: string]: any;
  ':@'?: Record<string, string>;
};

/**
 * Returns the XML tag name of an AST node (excluding attribute metadata ':@').
 */
export function getTagName(node: FxpNode): string | undefined {
  if (!node || typeof node !== 'object') return undefined;
  return Object.keys(node).find((k) => k !== ':@');
}

/**
 * Returns all attributes for a given node.
 */
export function getAttributes(node: FxpNode): Record<string, string> {
  return node[':@'] || {};
}

/**
 * Retrieves an attribute value by name (handles @_ and w: prefixes flexibly).
 */
export function getAttr(node: FxpNode, attrName: string): string | undefined {
  const attrs = getAttributes(node);
  if (attrs[attrName] !== undefined) return attrs[attrName];
  if (attrs[`@_${attrName}`] !== undefined) return attrs[`@_${attrName}`];
  if (attrs[`@_w:${attrName}`] !== undefined) return attrs[`@_w:${attrName}`];
  if (attrs[`@_m:${attrName}`] !== undefined) return attrs[`@_m:${attrName}`];

  const targetLower = attrName.toLowerCase();
  for (const [k, v] of Object.entries(attrs)) {
    const cleanK = k.replace(/^@_/, '').replace(/^[a-zA-Z0-9_-]+:/, '').toLowerCase();
    if (cleanK === targetLower) return v;
  }
  return undefined;
}

/**
 * Returns the array of child nodes for an AST node.
 */
export function getChildren(node: FxpNode): FxpNode[] {
  const tagName = getTagName(node);
  if (!tagName) return [];
  const val = node[tagName];
  return Array.isArray(val) ? val : [];
}

/**
 * Finds the first direct child matching the given tag name.
 */
export function findChild(node: FxpNode, childTagName: string): FxpNode | undefined {
  const children = getChildren(node);
  return children.find((c) => getTagName(c) === childTagName);
}

/**
 * Finds all direct children matching the given tag name.
 */
export function findChildren(node: FxpNode, childTagName: string): FxpNode[] {
  const children = getChildren(node);
  return children.filter((c) => getTagName(c) === childTagName);
}

/**
 * Recursively searches for the first descendant matching the given tag name.
 */
export function findDescendant(node: FxpNode, tagName: string): FxpNode | undefined {
  const children = getChildren(node);
  for (const child of children) {
    if (getTagName(child) === tagName) return child;
    const found = findDescendant(child, tagName);
    if (found) return found;
  }
  return undefined;
}

/**
 * Recursively gathers all text content within a node.
 */
export function getTextContent(node: FxpNode): string {
  const tagName = getTagName(node);
  if (!tagName) return '';
  const val = node[tagName];
  if (typeof val === 'string' || typeof val === 'number') {
    return decodeXmlEntities(String(val));
  }
  if (!Array.isArray(val)) return '';

  let text = '';
  for (const item of val) {
    if (item && typeof item === 'object') {
      if ('#text' in item) {
        text += decodeXmlEntities(String(item['#text']));
      } else {
        text += getTextContent(item);
      }
    }
  }
  return text;
}

/**
 * Decodes standard XML and numerical character references.
 */
export function decodeXmlEntities(text: string): string {
  if (!text) return '';
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)));
}
