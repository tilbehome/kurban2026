"use client";

import { useEffect, useState } from "react";

/**
 * Debounced değer hook'u — MIMARI patterns.md
 *
 * Kullanım:
 *   const debounced = useDebounce(searchInput, 200);
 *   useEffect(() => { fetchData(debounced); }, [debounced]);
 */
export function useDebounce<T>(value: T, delay = 200): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return debounced;
}
