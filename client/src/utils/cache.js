/**
 * Unified Cache Utility with Stale-While-Revalidate (SWR) and Request Deduplication.
 */

const memoryCache = new Map();
const inFlightRequests = new Map();
let currentUserId = null;

export function setCacheUserId(id) {
  currentUserId = id;
}

/**
 * Get data from cache. 
 */
export function getCache(key) {
  const record = memoryCache.get(key);
  if (!record) return null;

  if (Date.now() > record.expiry) {
    return { data: record.data, isStale: true };
  }

  return { data: record.data, isStale: false };
}

/**
 * Set data to cache with a TTL (Time To Live in ms).
 */
export function setCache(key, data, ttl) {
  memoryCache.set(key, {
    data,
    expiry: Date.now() + ttl
  });
}

/**
 * Remove specific key from cache.
 */
export function removeCache(key) {
  memoryCache.delete(key);
}

/**
 * Clear the entire memory cache (e.g. on logout).
 */
export function clearCache() {
  memoryCache.clear();
  inFlightRequests.clear();
  currentUserId = null;
}

/**
 * Fetch with Request Deduplication and Caching.
 * @param {string} baseKey - Cache key 
 * @param {function} fetchFn - Async function to fetch data if cache misses
 * @param {number} ttl - Time to live in ms
 * @param {boolean} forceRefresh - Ignore cache and fetch fresh
 * @param {function} onBackgroundUpdate - Callback for SWR background refresh
 * @param {boolean} isUserSpecific - Whether to scope key to current user
 */
export async function withCache(baseKey, fetchFn, ttl = 60000, forceRefresh = false, onBackgroundUpdate = null, isUserSpecific = true) {
  const key = isUserSpecific && currentUserId ? `${currentUserId}:${baseKey}` : baseKey;

  if (!forceRefresh) {
    const cached = getCache(key);
    // If we have valid, non-stale data, return it immediately
    if (cached) {
      if (cached.isStale && onBackgroundUpdate) {
        // Trigger background fetch (SWR)
        let requestPromise = inFlightRequests.get(key);
        if (!requestPromise) {
          requestPromise = fetchFn()
            .then((data) => {
              setCache(key, data, ttl);
              inFlightRequests.delete(key);
              onBackgroundUpdate(data);
              return data;
            })
            .catch((error) => {
              inFlightRequests.delete(key);
              console.error('Background update failed:', error);
            });
          inFlightRequests.set(key, requestPromise);
        } else {
          requestPromise.then(data => onBackgroundUpdate(data)).catch(() => {});
        }
      }
      return cached.data;
    }
  }

  // If a request is already in flight for this key, return that promise
  if (inFlightRequests.has(key)) {
    return inFlightRequests.get(key);
  }

  // Otherwise, start a new request
  const requestPromise = fetchFn()
    .then((data) => {
      setCache(key, data, ttl);
      inFlightRequests.delete(key);
      return data;
    })
    .catch((error) => {
      inFlightRequests.delete(key);
      throw error;
    });

  inFlightRequests.set(key, requestPromise);
  
  return requestPromise;
}

/**
 * Centralized TTL Configuration
 */
export const CACHE_TTL = {
  STATIC: 300000,         // 5 minutes
  PROFILE: 60000,         // 60 seconds
  SKILLS: 60000,          // 60 seconds
  DASHBOARD: 30000,       // 30 seconds
  OPPORTUNITIES: 30000,   // 30 seconds
  APPLICATIONS: 15000,    // 15 seconds
  NOTIFICATIONS: 15000,   // 15 seconds
  EDUCATION: 120000,      // 2 minutes
  PROJECTS: 120000,       // 2 minutes
  INTERNSHIPS: 120000,    // 2 minutes
  CERTIFICATIONS: 120000, // 2 minutes
  GOALS: 120000           // 2 minutes
};

/**
 * Synchronously read from cache (useful for initial state to prevent UI flicker)
 */
export function readCacheSync(baseKey, isUserSpecific = true) {
  const key = isUserSpecific && currentUserId ? `${currentUserId}:${baseKey}` : baseKey;
  const cached = getCache(key);
  if (cached && !cached.isStale) {
    return cached.data;
  }
  if (cached && cached.isStale) {
     return cached.data; // Return stale data for SWR initial render
  }
  return null;
}
