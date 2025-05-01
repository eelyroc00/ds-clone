type FetchOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  auth?: boolean;
};

export async function fetchApi<T>(url: string, options: FetchOptions = {}): Promise<T> {
  const { method = 'GET', headers = {}, body, auth = true } = options;

  const requestHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (auth) {
    const token = localStorage.getItem('token');
    if (token) {
      requestHeaders.Authorization = `Bearer ${token}`;
    }
  }

  const requestOptions: RequestInit = {
    method,
    headers: requestHeaders,
    body: body ? JSON.stringify(body) : undefined,
  };

  const response = await fetch(url, requestOptions);

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const error = new Error(
      errorData?.message || `API request failed with status ${response.status}`
    );
    // @ts-ignore
    error.status = response.status;
    // @ts-ignore
    error.data = errorData;
    throw error;
  }

  // For 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const apiClient = {
  get: <T>(url: string, options: Omit<FetchOptions, 'method' | 'body'> = {}) => 
    fetchApi<T>(url, { ...options, method: 'GET' }),
  
  post: <T>(url: string, data: any, options: Omit<FetchOptions, 'method'> = {}) =>
    fetchApi<T>(url, { ...options, method: 'POST', body: data }),
  
  put: <T>(url: string, data: any, options: Omit<FetchOptions, 'method'> = {}) =>
    fetchApi<T>(url, { ...options, method: 'PUT', body: data }),
  
  patch: <T>(url: string, data: any, options: Omit<FetchOptions, 'method'> = {}) =>
    fetchApi<T>(url, { ...options, method: 'PATCH', body: data }),
  
  delete: <T>(url: string, options: Omit<FetchOptions, 'method' | 'body'> = {}) =>
    fetchApi<T>(url, { ...options, method: 'DELETE' }),
}; 