'use client';

import { useSyncExternalStore } from 'react';

// No external source ever changes this snapshot, so subscription is a no-op.
const unsubscribe = () => undefined;
const subscribe = () => unsubscribe;
const getSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * Client-hydration guard: `false` during server rendering and the first client
 * paint, `true` once hydrated. Preferred over a `useState`/`useEffect` mount
 * flag because it neither triggers a cascading render nor a hydration mismatch.
 */
export function useIsMounted(): boolean {
    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
