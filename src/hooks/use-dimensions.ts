"use client";
import { useState, useEffect } from 'react';

export const useDimensions = (container: Element) => {
  const [dimensions, setDimensions] = useState({ height: container.clientHeight, width: container.clientWidth });

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        height: container.clientHeight,
        width: container.clientWidth
      });
    };

    container.addEventListener('resize', handleResize);
    return () => container.removeEventListener('resize', handleResize);
  }, [container]);

  return dimensions;
}