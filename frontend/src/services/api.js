// src/services/api.js
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

async function api(path, { method = 'GET', token, body, isForm } = {}) {
  const headers = {};

  // Sätt headers på ett tydligt sätt (utan konstiga uttryck)
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!isForm && body) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: isForm ? body : (body ? JSON.stringify(body) : undefined),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Request failed with status ${res.status}`);
  }

  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return res.json();
  }
  return res;
}

// --- SPECIFIKA FUNKTIONER ---

// Dashboard-data (metrics)
export function getMetrics(token) {
  return api('/api/dashboard/metrics', { token });
}

// Login
export function loginReq(email, password) {
  return api('/api/auth/login', {
    method: 'POST',
    body: { email, password },
  });
}

// Register
export function registerReq(name, email, password) {
  return api('/api/auth/register', {
    method: 'POST',
    body: { name, email, password },
  });
}

// Lista filer
export function listFiles(token) {
  return api('/api/files', { token });
}

// Ladda upp fil
export function uploadFile(token, file) {
  const form = new FormData();
  form.append('file', file);
  return api('/api/files', {
    method: 'POST',
    token,
    body: form,
    isForm: true,
  });
}

// Ladda ner fil
export function downloadFile(token, id) {
  return fetch(`${BASE_URL}/api/files/${id}/download`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}


