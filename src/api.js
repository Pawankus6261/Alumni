const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
const PUBLIC_CACHE_PREFIX = 'bgi-public-v4:';
const PUBLIC_CACHE_TTL = 30 * 60 * 1000;
const memoryCache = new Map();

function readPublicCache(key) {
  const memory = memoryCache.get(key);
  if (memory && Date.now() - memory.savedAt < PUBLIC_CACHE_TTL) return memory.value;
  try {
    const cached = JSON.parse(localStorage.getItem(`${PUBLIC_CACHE_PREFIX}${key}`) || 'null');
    if (cached && Date.now() - cached.savedAt < PUBLIC_CACHE_TTL) {
      memoryCache.set(key, cached);
      return cached.value;
    }
  } catch { /* Storage can be unavailable or full; the API remains the source of truth. */ }
  return null;
}

function writePublicCache(key, value) {
  const entry = { savedAt: Date.now(), value };
  memoryCache.set(key, entry);
  try { localStorage.setItem(`${PUBLIC_CACHE_PREFIX}${key}`, JSON.stringify(entry)); } catch { /* Continue with memory cache only. */ }
}

export function clearPublicDataCache() {
  memoryCache.clear();
  try {
    for (let index = localStorage.length - 1; index >= 0; index -= 1) {
      const key = localStorage.key(index);
      if (key?.startsWith(PUBLIC_CACHE_PREFIX)) localStorage.removeItem(key);
    }
  } catch { /* Ignore unavailable storage. */ }
}

export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function apiRequest(path, options = {}) {
  const headers = new Headers(options.headers || {});
  if (!(options.body instanceof FormData) && options.body != null && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const token = sessionStorage.getItem('bgi_admin_token');
  if (token && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  } catch {
    throw new ApiError('We could not connect to the service. Please try again shortly.');
  }

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : await response.text();
  if (!response.ok) {
    const detail = typeof payload === 'object' ? payload?.detail : payload;
    throw new ApiError(detail || `Request failed (${response.status}).`, response.status);
  }
  return payload;
}

const cachedPublicGet = (path) => {
  const cached = readPublicCache(path);
  if (cached !== null) return Promise.resolve(cached);
  return apiRequest(path).then(value => { writePublicCache(path, value); return value; });
};
export const getCachedPublicBootstrap = () => readPublicCache('/public/bootstrap');
export const getPublicBootstrap = () => cachedPublicGet('/public/bootstrap');
export const getAlumni = () => cachedPublicGet('/alumni');
export const getMembers = () => cachedPublicGet('/members');
export const getEvents = () => cachedPublicGet('/events');
export const getGallery = () => cachedPublicGet('/gallery');
export const getCourses = () => apiRequest('/courses');
export const getBistaaStatus = (query) => apiRequest(`/bistaa/status?query=${encodeURIComponent(query)}`);

export async function verifyAlumnus(query) {
  try {
    return await apiRequest(`/verify?query=${encodeURIComponent(query)}`);
  } catch (error) {
    const bootstrap = getCachedPublicBootstrap();
    if (bootstrap) {
      const q = String(query || '').trim().toLowerCase();
      const allAlumni = [...(bootstrap.members || []), ...(bootstrap.alumni || [])];
      const match = allAlumni.find(a =>
        String(a.enroll_no || a.enrollment || '').toLowerCase() === q ||
        String(a.bistaa_id || a.membership_id || '').toLowerCase() === q ||
        String(a.id || '').toLowerCase() === q ||
        `${a.firstname || ''} ${a.lastname || ''}`.toLowerCase().includes(q)
      );
      if (match) {
        const isMember = Boolean(match.is_bistaa_member || match.bistaa_id);
        const name = `${match.firstname || ''} ${match.lastname || ''}`.trim();
        return {
          verified: true,
          verification_type: isMember ? 'BISTAA_LIFETIME_MEMBER' : 'VERIFIED_ALUMNUS',
          badge_label: isMember ? 'Officially Verified BISTAA Lifetime Member' : 'Officially Verified BGI Alumnus',
          verification_code: `BGI-VRF-${Date.now().toString(16).slice(-6).toUpperCase()}`,
          verified_at: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
          alumnus: {
            ...match,
            name,
            enrollment: match.enroll_no || match.enrollment || '',
            membership_id: match.bistaa_id || match.membership_id || '',
            course: match.course || match.branch || '',
            branch: match.course || match.branch || '',
            employer: match.connected_to || '',
            position: match.pos || '',
            location: match.companyloc || '',
            sector: match.companysector || '',
          },
          institution: {
            name: 'Bansal Institute of Science & Technology (BIST)',
            group: 'Bansal Group of Institutions (BGI), Bhopal',
            council: 'BIST Alumni Association (BISTAA) Executive Council',
            affiliations: 'AICTE Approved • NAAC Accredited • Affiliated to RGPV & Barkatullah University',
            campus: 'Kokta, Anand Nagar, Bhopal, Madhya Pradesh 462021',
          }
        };
      }
    }
    throw error;
  }
}

export function submitRegistration(data, avatarFile) {
  const form = new FormData();
  [
    'firstname', 'lastname', 'gender', 'native_state', 'native_place', 'college', 'batch', 'course',
    'enroll_no', 'companysector', 'connected_to', 'pos', 'comploc', 'companyloc', 'email',
    'phone_no', 'linkedinid', 'bio',
  ].forEach((key) => form.append(key, String(data[key] ?? '')));
  if (avatarFile) form.append('avatar', avatarFile);
  return apiRequest('/register', { method: 'POST', body: form });
}

export function submitBistaaApplication(data, slipFile) {
  const form = new FormData();
  form.append('enrollment', data.enrollment);
  form.append('name', data.name);
  form.append('branch', data.branch);
  form.append('college', data.college);
  form.append('upi_transaction_id', data.upi_transaction_id);
  form.append('transaction_slip', slipFile);
  return apiRequest('/bistaa/applications', { method: 'POST', body: form });
}

export function createRsvp(eventId, data) {
  return apiRequest(`/events/${encodeURIComponent(eventId)}/rsvp`, {
    method: 'POST', body: JSON.stringify(data),
  });
}

export function adminLogin(username, password) {
  const form = new FormData();
  form.append('username', username);
  form.append('password', password);
  return apiRequest('/admin/login', { method: 'POST', body: form });
}

export const getAdminApplications = () => apiRequest('/admin/applications');
export const getAdminBistaaMembers = () => apiRequest('/admin/bistaa/members');
export const updateAdminBistaaMember = (id, payload) => apiRequest(`/admin/bistaa/members/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
export const getPendingAlumni = () => apiRequest('/admin/alumni/pending');
export const getAdminAlumni = () => apiRequest('/admin/alumni');
export const getAdminRsvps = () => apiRequest('/admin/rsvps');
export const setAlumnusVerification = (id, verified) => apiRequest(`/admin/alumni/${id}/verify`, {
  method: 'POST', body: JSON.stringify({ verified }),
});
export const rejectAdminAlumnus = (id) => apiRequest(`/admin/alumni/${id}/reject`, { method: 'POST' });
export const deleteAdminAlumnus = (id) => apiRequest(`/admin/alumni/${id}`, { method: 'DELETE' });
export const updateAdminAlumnus = (id, payload) => apiRequest(`/admin/alumni/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
export const updateAdminAlumnusPhoto = (id, { photo_url = '', file } = {}) => {
  const form = new FormData();
  form.append('photo_url', photo_url);
  if (file) form.append('avatar', file);
  return apiRequest(`/admin/alumni/${id}/photo`, { method: 'PUT', body: form });
};
export const reviewAdminApplication = (id, payload) => apiRequest(`/admin/applications/${id}/review`, {
  method: 'POST', body: JSON.stringify(payload),
});
export const createAdminEvent = async (payload) => {
  const res = await apiRequest('/admin/events', { method: 'POST', body: JSON.stringify(payload) });
  clearPublicDataCache();
  return res;
};
export const updateAdminEvent = async (id, payload) => {
  const res = await apiRequest(`/admin/events/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  clearPublicDataCache();
  return res;
};
export const deleteAdminEvent = async (id) => {
  const res = await apiRequest(`/admin/events/${id}`, { method: 'DELETE' });
  clearPublicDataCache();
  return res;
};
export const createAdminGalleryItem = async (form) => {
  const res = await apiRequest('/admin/gallery', { method: 'POST', body: form });
  clearPublicDataCache();
  return res;
};
export const updateAdminGalleryItem = async (id, payload) => {
  const res = await apiRequest(`/admin/gallery/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  clearPublicDataCache();
  return res;
};
export const deleteAdminGalleryItem = async (id) => {
  const res = await apiRequest(`/admin/gallery/${id}`, { method: 'DELETE' });
  clearPublicDataCache();
  return res;
};
export const createDepartment = async (payload) => {
  const res = await apiRequest('/admin/departments', { method: 'POST', body: JSON.stringify(payload) });
  clearPublicDataCache();
  return res;
};
export const updateDepartment = async (id, payload) => {
  const res = await apiRequest(`/admin/departments/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  clearPublicDataCache();
  return res;
};
export const deleteDepartment = async (id) => {
  const res = await apiRequest(`/admin/departments/${id}`, { method: 'DELETE' });
  clearPublicDataCache();
  return res;
};
export const deleteAdminRsvp = (id) => apiRequest(`/admin/rsvps/${id}`, { method: 'DELETE' });
export const getAdminAccounts = () => apiRequest('/admin/accounts');
export const createAdminAccount = (payload) => apiRequest('/admin/accounts', { method: 'POST', body: JSON.stringify(payload) });
export const changeAdminRole = (username, role) => apiRequest(`/admin/accounts/${encodeURIComponent(username)}/role`, { method: 'PUT', body: JSON.stringify({ role }) });
export const resetAdminAccountPassword = (username, password) => apiRequest(`/admin/accounts/${encodeURIComponent(username)}/password`, { method: 'PUT', body: JSON.stringify({ password }) });
export const deleteAdminAccount = (username) => apiRequest(`/admin/accounts/${encodeURIComponent(username)}`, { method: 'DELETE' });
export const getAdminAudit = () => apiRequest('/admin/audit');
export const getAdminNotifications = () => apiRequest('/admin/notifications');
export const markAdminNotificationRead = (id) => apiRequest(`/admin/notifications/${encodeURIComponent(id)}/read`, { method: 'POST' });
export const getAdminAnalytics = () => apiRequest('/admin/analytics');
export const getAdminBackups = () => apiRequest('/admin/backups');
export async function downloadSavedBackup(filename) {
  const headers = new Headers();
  const token = sessionStorage.getItem('bgi_admin_token');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(`${API_BASE}/admin/backups/${encodeURIComponent(filename)}`, { headers });
  if (!response.ok) throw new ApiError('Could not download this backup.', response.status);
  return response.blob();
}
export const previewAlumniImport = (file) => { const body = new FormData(); body.append('file', file); return apiRequest('/admin/alumni/import/preview', { method: 'POST', body }); };
export const commitAlumniImport = (file) => { const body = new FormData(); body.append('file', file); return apiRequest('/admin/alumni/import', { method: 'POST', body }); };
export const createDatabaseBackup = async () => {
  const headers = new Headers();
  const token = sessionStorage.getItem('bgi_admin_token');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(`${API_BASE}/admin/backup`, { headers });
  if (!response.ok) throw new ApiError('Could not create a database backup.', response.status);
  return { blob: await response.blob(), filename: response.headers.get('content-disposition')?.match(/filename="?([^";]+)"?/)?.[1] || 'alumni-backup.sqlite3' };
};
export const restoreDatabaseBackup = (file) => { const body = new FormData(); body.append('file', file); return apiRequest('/admin/restore', { method: 'POST', body }); };

export async function getAdminSlipUrl(id) {
  const headers = new Headers();
  const token = sessionStorage.getItem('bgi_admin_token');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(`${API_BASE}/admin/slips/${encodeURIComponent(id)}`, { headers });
  if (!response.ok) throw new ApiError('Could not load the private payment slip.', response.status);
  return URL.createObjectURL(await response.blob());
}
