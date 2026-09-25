import { useState, useEffect, useCallback } from 'react';

/**
 * A React hook that wraps an API function that uses `withCache`.
 * Handles loading states, errors, and Stale-While-Revalidate (SWR) UI updates.
 *
 * @param {function} apiFn - The API function to call (e.g., fetchStudentProfile)
 * @param {function} formatFn - Optional formatter for the response data
 * @param {boolean} executeOnMount - Whether to run the fetch immediately
 */
export function useApi(apiFn, formatFn = (d) => d, executeOnMount = true) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    const onBackgroundUpdate = (freshData) => {
      if (isMounted) {
        setData(formatFn(freshData));
      }
    };

    try {
      // We pass the args, plus forceRefresh=false and our background updater
      const result = await apiFn(false, onBackgroundUpdate);
      if (isMounted) {
        setData(formatFn(result));
      }
    } catch (err) {
      if (isMounted) {
        setError(err.message || 'An error occurred.');
      }
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }

    return () => {
      isMounted = false;
    };
  }, [apiFn, formatFn]);

  useEffect(() => {
    let cleanup = () => {};
    if (executeOnMount) {
      execute().then(fn => {
        if (typeof fn === 'function') cleanup = fn;
      });
    }
    return () => cleanup();
  }, [execute, executeOnMount]);

  return { data, loading, error, execute, setData };
}
