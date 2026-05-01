const API_URL = __DEV__ ? 'http://192.168.1.8:8000/api' : 'https://your-production-url.com/api';

let _token = null;
export const setToken = (t) => { _token = t; };
export const getToken = () => _token;

export async function api(path, opts = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${_token}`, ...opts.headers },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `API ${res.status}`);
  }
  return res.json();
}

export async function uploadFile(uri, filename, type) {
  const fd = new FormData();
  fd.append('file', { uri, name: filename, type });
  const res = await fetch(`${API_URL}/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${_token}` },
    body: fd,
  });
  if (!res.ok) throw new Error(`Upload ${res.status}`);
  return res.json();
}
