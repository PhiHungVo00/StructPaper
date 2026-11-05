/**
 * Deep merge utility for 3-tier Journal Profile inheritance.
 *
 * Rules:
 * - Pure function (no mutations of target or source).
 * - Objects are deep-merged (source overrides target).
 * - Arrays replace target entirely by default.
 * - If $append: true is specified (via object { $append: true, values/items }
 *   or array with $append property / marker), source items are appended to target array.
 * - Explicit null in source clears / disables the target field.
 * - undefined in source preserves target field.
 */

export function isPlainObject(val: unknown): val is Record<string, unknown> {
  return (
    typeof val === 'object' &&
    val !== null &&
    !Array.isArray(val) &&
    Object.prototype.toString.call(val) === '[object Object]'
  );
}

export function cloneDeep<T>(val: T): T {
  if (val === null || typeof val !== 'object') {
    return val;
  }
  if (Array.isArray(val)) {
    const arrCopy = val.map((item) => cloneDeep(item)) as unknown as T;
    if ((val as unknown as { $append?: boolean }).$append === true) {
      (arrCopy as unknown as { $append: boolean }).$append = true;
    }
    return arrCopy;
  }
  const objCopy: Record<string, unknown> = {};
  for (const key of Object.keys(val)) {
    objCopy[key] = cloneDeep((val as Record<string, unknown>)[key]);
  }
  return objCopy as T;
}

interface AppendObject {
  $append: true;
  values?: unknown[];
  items?: unknown[];
}

function isAppendObject(val: unknown): val is AppendObject {
  if (!isPlainObject(val)) return false;
  return (
    val.$append === true &&
    (Array.isArray(val.values) || Array.isArray(val.items))
  );
}

function resolveAppendedArray(target: unknown, sourceItems: unknown[]): unknown[] {
  const baseArr = Array.isArray(target) ? target.map(cloneDeep) : [];
  return [...baseArr, ...sourceItems.map(cloneDeep)];
}

export function deepMerge<T extends Record<string, unknown>>(
  target: T,
  source?: Record<string, unknown> | null
): T {
  if (!source) {
    return cloneDeep(target);
  }

  const result: Record<string, unknown> = cloneDeep(target);

  for (const key of Object.keys(source)) {
    const sVal = source[key];
    const tVal = result[key];

    if (sVal === undefined) {
      continue;
    }

    if (sVal === null) {
      result[key] = null;
      continue;
    }

    if (isAppendObject(sVal)) {
      const items = sVal.values ?? sVal.items ?? [];
      result[key] = resolveAppendedArray(tVal, items);
      continue;
    }

    if (Array.isArray(sVal)) {
      if ((sVal as unknown as { $append?: boolean }).$append === true) {
        result[key] = resolveAppendedArray(tVal, sVal);
      } else if (
        sVal.length > 0 &&
        isPlainObject(sVal[0]) &&
        sVal[0].$append === true
      ) {
        result[key] = resolveAppendedArray(tVal, sVal.slice(1));
      } else {
        result[key] = cloneDeep(sVal);
      }
      continue;
    }

    if (isPlainObject(sVal)) {
      if (isPlainObject(tVal)) {
        result[key] = deepMerge(tVal, sVal);
      } else {
        result[key] = cloneDeep(sVal);
      }
      continue;
    }

    result[key] = sVal;
  }

  return result as T;
}
