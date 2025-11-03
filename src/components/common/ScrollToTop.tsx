// src/components/common/ScrollToTop.tsx

'use client';

import { useEffect } from 'react';

export default function ScrollToTop(): null {
  // This effect runs when the component mounts on the client
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []); // The empty array ensures it only runs once

  // This component renders nothing to the DOM
  return null;
}