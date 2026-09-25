const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

async function apiRequest(path, options = {}) {
  const url = `${API_BASE_URL}${path}`;
  console.log('[API DEBUG] preparing request', { url, method: options.method || 'GET', credentials: 'include', headers: options.headers });
  
  try {
    console.log('[API DEBUG] fetch started', url);
    const response = await fetch(url, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    });
    console.log('[API DEBUG] fetch completed', { url, status: response.status });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload?.error?.message || 'Request failed');
    }

    return response.json();
  } catch (error) {
    console.error('[API DEBUG] fetch failed', error);
    throw error;
  }
}

export { apiRequest };
