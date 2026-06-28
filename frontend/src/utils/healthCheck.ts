import { API_URL } from '../constants/api';

export const checkBackendHealth = async (signal?: AbortSignal): Promise<boolean> => {
  try {
    const healthUrl = API_URL.replace(/\/api\/?$/, '') + '/health';
    const response = await fetch(healthUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal,
      cache: 'no-store'
    });

    if (response.ok) {
      const data = await response.json();
      return data.status === 'ok';
    }
    return false;
  } catch (error) {
    return false;
  }
};
