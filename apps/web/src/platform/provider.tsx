'use client';

import React, { useEffect, useState } from 'react';
import {
  PlatformProvider as CorePlatformProvider,
  createFakePlatform,
  type PlatformServices,
} from '@structpaper/platform';
import { createPlatform } from './bootstrap';
import { registerAppSlots } from './slots';

// Ensure standard polymorphic slots are registered
registerAppSlots();

export interface PlatformProviderProps {
  children: React.ReactNode;
  value?: PlatformServices;
}

/**
 * Root PlatformProvider for Next.js application.
 * If no explicit `value` is provided, automatically loads and initializes
 * the platform adapter (Web or Desktop) via dynamic bootstrap.
 */
export function PlatformProvider({
  children,
  value,
}: PlatformProviderProps): React.ReactElement {
  const [platform, setPlatform] = useState<PlatformServices>(
    () => value ?? createFakePlatform({ kind: 'web' })
  );

  useEffect(() => {
    if (value) {
      setPlatform(value);
      return;
    }

    let isMounted = true;
    createPlatform()
      .then((p) => {
        if (isMounted) {
          setPlatform(p);
        }
      })
      .catch((err) => {
        console.error('Failed to bootstrap platform services:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [value]);

  return (
    <CorePlatformProvider value={value ?? platform}>
      {children}
    </CorePlatformProvider>
  );
}
