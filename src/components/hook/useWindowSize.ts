import { useMemo, useSyncExternalStore } from 'react';

const subscribe = (callback: () => void) => {
  window.addEventListener('resize', callback);
  return () => window.removeEventListener('resize', callback);
};
const getServerSideSnapshot = () => 0;

export function useWindowWidth() {
  return useSyncExternalStore(
    subscribe,
    () => window.innerWidth,
    getServerSideSnapshot
  );
}
export function useWindowHeight() {
  return useSyncExternalStore(
    subscribe,
    () => window.innerHeight,
    getServerSideSnapshot
  );
}

export default function useWindowSize(): number[] {
  const width = useWindowWidth();
  const height = useWindowWidth();
  const size = useMemo(() => [width, height], [width, height])
  return size;
};
