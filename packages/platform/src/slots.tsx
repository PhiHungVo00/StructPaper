'use client';

import React from 'react';
import type { PlatformKind } from './types';
import { usePlatform } from './context';

export type SlotImplementations<P = any> = Record<PlatformKind, React.ComponentType<P> | null>;

export type SlotRegistry = Record<string, SlotImplementations<any>>;

const globalSlotRegistry = new Map<string, SlotImplementations<any>>();

/**
 * Defines a set of polymorphic platform slots.
 * Guarantees at compile-time that every slot provides an implementation
 * or explicitly specifies `null` for each PlatformKind.
 */
export function defineSlots<
  T extends Record<string, Record<PlatformKind, React.ComponentType<any> | null>>
>(slots: T): T {
  for (const [id, implementations] of Object.entries(slots)) {
    globalSlotRegistry.set(id, implementations);
  }
  return slots;
}

export function registerSlot<P = any>(
  id: string,
  implementations: Record<PlatformKind, React.ComponentType<P> | null>
): void {
  globalSlotRegistry.set(id, implementations);
}

export function getRegisteredSlot(
  id: string
): Record<PlatformKind, React.ComponentType<any> | null> | undefined {
  return globalSlotRegistry.get(id);
}

export function clearSlotRegistry(): void {
  globalSlotRegistry.clear();
}

export interface SlotProps {
  id: string;
  slots?: SlotRegistry;
  fallback?: React.ReactNode;
  [key: string]: any;
}

/**
 * Declarative Slot component that dynamically resolves and renders
 * the appropriate platform component for the current runtime.
 * If the current platform mapping is null, renders fallback or null.
 */
export function Slot({
  id,
  slots,
  fallback = null,
  ...rest
}: SlotProps): React.ReactElement | null {
  const { capabilities } = usePlatform();
  const kind = capabilities.kind;

  const slotEntry = slots ? slots[id] : globalSlotRegistry.get(id);

  if (!slotEntry) {
    return fallback ? <>{fallback}</> : null;
  }

  const Component = slotEntry[kind];
  if (!Component) {
    return fallback ? <>{fallback}</> : null;
  }

  return <Component {...rest} />;
}
