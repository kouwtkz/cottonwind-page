import { useLayoutEffect, useState } from 'react';

// お借りしました https://zenn.dev/kenghaya/articles/6020b6192dadec

export default function useWindowSize(): number[] {
  const [size, setSize] = useState([0, 0]);
  useLayoutEffect(() => {
    const updateSize = (): void => {
      setSize([window.innerWidth, window.innerHeight]);
    };

    window.addEventListener('resize', updateSize);
    updateSize();

    return () => window.removeEventListener('resize', updateSize);
  }, []);
  return size;
};