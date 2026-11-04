import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity, Bell, CalendarDays, Check, CheckCircle2, ChevronRight, Clock3, Download, Eye, EyeOff,
  FileImage, GraduationCap, LayoutDashboard, LogOut, Menu, PanelLeftClose, PanelLeftOpen, RefreshCw, Search,
  Pencil, ShieldCheck, TicketCheck, Trash2, Users, X, XCircle,
} from 'lucide-react';
import ImageWithPlaceholder from '../components/ImageWithPlaceholder';
import ImageUploadField from '../components/ImageUploadField';
import Pagination from '../components/Pagination';
import { BGI_BHOPAL_LOGO } from '../brand';
import {
  adminLogin, changeAdminRole, commitAlumniImport, createAdminAccount, createAdminEvent, createAdminGalleryItem, createDatabaseBackup, createDepartment, getAdminAlumni, uploadAdminEventBanner,
  deleteAdminAccount, deleteAdminEvent, deleteAdminGalleryItem, deleteAdminRsvp, deleteDepartment, downloadSavedBackup,
  getAdminAccounts, getAdminApplications, getAdminBistaaMembers, getAdminBackups, getAdminRsvps, getCourses, getEvents, getGallery,
  getAdminAnalytics, getAdminAudit, getAdminNotifications, getPendingAlumni, previewAlumniImport, rejectAdminAlumnus, resetAdminAccountPassword, restoreDatabaseBackup, reviewAdminApplication, deleteAdminApplication, setAlumnusVerification, deleteAdminAlumnus,
  updateAdminAlumnus, updateAdminAlumnusPhoto, updateAdminBistaaMember, updateAdminEvent, updateAdminGalleryItem, updateDepartment, markAdminNotificationRead,
} from '../api';

const NAV = [
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { id: 'gallery', label: 'Gallery', icon: FileImage },
  { id: 'verified', label: 'Verified Alumni List', icon: CheckCircle2 },
  { id: 'unverified', label: 'Not Verified Alumni List', icon: Clock3 },
  { id: 'events', label: 'Events', icon: CalendarDays },
  { id: 'departments', label: 'Departments', icon: GraduationCap },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'access', label: 'Admin Accounts', icon: ShieldCheck },
  { id: 'bistaa-members', label: 'BISTAA Members', icon: Users },
  { id: 'bistaa', label: 'BISTAA Applications', icon: ShieldCheck },
  { id: 'rsvps', label: 'Event RSVPs', icon: TicketCheck },
  { id: 'analytics', label: 'Reports & Analytics', icon: Activity },
  { id: 'audit', label: 'Activity Log', icon: Clock3 },
  { id: 'system', label: 'Backup & Restore', icon: Download },
];

function saveCsv(filename, rows) {
  const csv = rows.map(row => row.map(value => `"${String(value ?? '').replaceAll('"', '""')}"`).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function AdminDialog({ dialog, onClose, onSubmit, busy, showToast }) {
  const [values, setValues] = useState(dialog?.initial || {});
  const [photoTouched, setPhotoTouched] = useState(false);
  const [photoPreview, setPhotoPreview] = useState('');
  const [isNewCategory, setIsNewCategory] = useState(false);
  useEffect(() => {
    setValues(dialog?.initial || {});
    setPhotoTouched(false);
    setIsNewCategory(false);
  }, [dialog]);
  useEffect(() => {
    if (!(values.avatar instanceof File)) { setPhotoPreview(''); return undefined; }
    const preview = URL.createObjectURL(values.avatar);
    setPhotoPreview(preview);
    return () => URL.revokeObjectURL(preview);
  }, [values.avatar]);
  if (!dialog) return null;
  const change = (key, value) => setValues(current => ({ ...current, [key]: value }));
  return <div className="admin-dialog-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <form className="admin-dialog" onSubmit={event => { event.preventDefault(); onSubmit(values, photoTouched); }}>
      <div className="admin-dialog-heading"><div><p className="admin-kicker">ADMINISTRATION</p><h2>{dialog.title}</h2><p>{dialog.description}</p></div><button type="button" className="admin-dialog-close" aria-label="Close" onClick={onClose}><X size={19} /></button></div>
      {dialog.photoEditor && <div className="admin-profile-photo-editor">
        <ImageWithPlaceholder src={photoPreview || values.photo_url} alt="Profile photo preview" variant="avatar" className="admin-profile-photo-preview" placeholderLabel={`${values.firstname?.[0] || values.name?.[0] || ''}${values.lastname?.[0] || values.name?.split(/\s+/)[1]?.[0] || ''}`.toUpperCase() || 'Photo'} />
        <div><b>{photoPreview ? 'New photo preview' : values.photo_url ? 'Current profile photo' : 'No profile photo yet'}</b><span>Upload a JPG, PNG, or WebP image (max 5 MB), or paste an image URL.</span></div>
      </div>}
      <div className="admin-dialog-fields">{dialog.fields.filter(field => !field.visibleWhen || field.visibleWhen(values)).map(field => <label className={`admin-dialog-field${field.wide ? ' admin-field-wide' : ''}`} key={field.name}>{field.label}
        {field.type === 'textarea' ? <textarea required={field.required !== false} rows={4} value={values[field.name] || ''} onChange={event => change(field.name, event.target.value)} />
          : field.type === 'category_picker' ? (
            <div className="admin-category-picker" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
              <select
                required={!isNewCategory}
                value={isNewCategory ? '__NEW_CATEGORY__' : (values[field.name] || field.categories?.[0] || 'Campus Life')}
                onChange={event => {
                  if (event.target.value === '__NEW_CATEGORY__') {
                    setIsNewCategory(true);
                    change(field.name, '');
                  } else {
                    setIsNewCategory(false);
                    change(field.name, event.target.value);
                  }
                }}
              >
                <optgroup label="Select Existing Category">
                  {(field.categories || ['Campus Life', 'Convocation', 'Reunions', 'Awards']).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </optgroup>
                <optgroup label="New Category">
                  <option value="__NEW_CATEGORY__">➕ Add new category…</option>
                </optgroup>
              </select>
              {isNewCategory && (
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.25rem' }}>
                  <input
                    type="text"
                    placeholder="Enter new category name (e.g. 2K23, Sports Day)"
                    required
                    autoFocus
                    value={values[field.name] || ''}
                    onChange={event => change(field.name, event.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className="admin-secondary-btn admin-small-btn"
                    style={{ whiteSpace: 'nowrap' }}
                    onClick={() => {
                      setIsNewCategory(false);
                      change(field.name, field.categories?.[0] || 'Campus Life');
                    }}
                  >
                    Use existing
                  </button>
                </div>
              )}
            </div>
          )
          : field.type === 'select' ? <select required={field.required !== false} value={values[field.name] || ''} onChange={event => { const value = event.target.value; if (field.onChange) setValues(current => ({ ...current, [field.name]: value, ...field.onChange(value, current) })); else change(field.name, value); }}>{field.options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
          : <input type={field.type || 'text'} required={field.required !== false} accept={field.accept} minLength={field.minLength} value={field.type === 'file' ? undefined : (values[field.name] || '')} onChange={event => { const value = field.type === 'file' ? event.target.files?.[0] : event.target.value; change(field.name, value); if (field.name === 'avatar' || field.name === 'photo_url') setPhotoTouched(true); }} />}
        {field.help && <small className="admin-dialog-help">{field.help}</small>}
      </label>)}</div>
      {dialog.kind === 'event' && <div className="admin-event-banner-upload">
        <span className="admin-dialog-field-label">Upload banner image</span>
        <ImageUploadField
          id="admin-event-banner-upload"
          value={values.bannerPreview || values.banner || ''}
          variant="document"
          title="Choose event banner"
          description="JPG, PNG or WebP · Up to 5 MB"
          maxSizeMB={5}
          onChange={({ file, preview }) => setValues(current => ({ ...current, banner_file: file, bannerPreview: preview }))}
          onRemove={() => setValues(current => ({ ...current, banner_file: null, bannerPreview: '', banner: '' }))}
          onError={message => showToast?.(message, 'error')}
        />
      </div>}
      <div className="admin-dialog-actions"><button type="button" className="admin-secondary-btn" onClick={onClose}>Cancel</button><button type="submit" className="admin-primary-btn" disabled={busy}>{busy ? 'Saving…' : dialog.submitLabel || 'Save changes'}</button></div>
    </form>
  </div>;
}

function AdminActionModal({ modal, onClose, onConfirm, busy }) {
  const [value, setValue] = useState('');
  useEffect(() => setValue(''), [modal]);
  if (!modal) return null;
  return <div className="admin-dialog-backdrop" role="presentation" onMouseDown={event => { if (!busy && event.target === event.currentTarget) onClose(); }}>
    <form className="admin-dialog admin-action-dialog" role="dialog" aria-modal="true" aria-labelledby="admin-action-title" onSubmit={event => { event.preventDefault(); onConfirm(value); }}>
      <div className="admin-dialog-heading"><div><p className="admin-kicker">{modal.kicker || 'CONFIRM ACTION'}</p><h2 id="admin-action-title">{modal.title}</h2><p>{modal.description}</p></div><button type="button" className="admin-dialog-close" aria-label="Close" disabled={busy} onClick={onClose}><X size={19} /></button></div>
      {modal.inputLabel && <label className="admin-dialog-field admin-action-input">{modal.inputLabel}<textarea rows={3} value={value} onChange={event => setValue(event.target.value)} placeholder={modal.inputPlaceholder || ''} /></label>}
      <div className="admin-dialog-actions"><button type="button" className="admin-secondary-btn" disabled={busy} onClick={onClose}>Cancel</button><button type="submit" className={modal.danger ? 'admin-danger-btn' : 'admin-primary-btn'} disabled={busy}>{busy ? 'Please wait…' : modal.confirmLabel || 'Confirm'}</button></div>
    </form>
  </div>;
}

function Table({ columns, rows, empty, mobileCards = false, className = '' }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  if (!rows.length) return <div className="admin-empty">{empty}</div>;
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageRows = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  return (
    <>
      <Pagination page={currentPage} pageSize={pageSize} total={rows.length} onPageChange={setPage} onPageSizeChange={value => { setPageSize(value); setPage(1); }} pageSizeOptions={[10, 25, 50, 100]} label="records" />
      <div className={`admin-table-wrap${mobileCards ? ' admin-table-mobile-cards' : ''}${className ? ` ${className}` : ''}`}>
        <table className="admin-data-table">
          <thead><tr>{columns.map(column => <th key={column.key}>{column.label}</th>)}</tr></thead>
          <tbody>{pageRows.map((row, index) => (
            <tr key={row.id ?? index}>{columns.map(column => (
              <td key={column.key} data-label={column.label}>{column.render ? column.render(row) : row[column.key] || '—'}</td>
            ))}</tr>
          ))}</tbody>
        </table>
      </div>
      {rows.length > pageSize && <Pagination page={currentPage} pageSize={pageSize} total={rows.length} onPageChange={setPage} onPageSizeChange={value => { setPageSize(value); setPage(1); }} pageSizeOptions={[10, 25, 50, 100]} label="records" />}
    </>
  );
}

function Metric({ label, value, caption, tone, icon: Icon }) {
  return (
    <article className={`admin-metric admin-metric-${tone}`}>
      <div className="admin-metric-copy"><span>{label}</span><strong>{value}</strong><small>{caption}</small></div>
      <Icon size={27} aria-hidden="true" />
    </article>
  );
}

export default function AdminPage({ alumniList = [], onOpenSlip, onOpenDigitalPass, showToast, onDataChanged }) {
  const [token, setToken] = useState(() => sessionStorage.getItem('bgi_admin_token') || '');
  const [adminRole, setAdminRole] = useState(() => sessionStorage.getItem('bgi_admin_role') || 'super_admin');
  const [adminDeptId, setAdminDeptId] = useState(() => {
    const val = sessionStorage.getItem('bgi_admin_dept_id');
    return val ? Number(val) : null;
  });
  const [adminDeptName, setAdminDeptName] = useState(() => sessionStorage.getItem('bgi_admin_dept_name') || '');
  const [activeSection, setActiveSection] = useState('dashboard');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('bgi_admin_sidebar_collapsed') === 'true');
  const [hoveredNav, setHoveredNav] = useState(null);
  const [apps, setApps] = useState([]);
  const [activeMemberCount, setActiveMemberCount] = useState(0);
  const [bistaaMembers, setBistaaMembers] = useState([]);
  const [adminProfiles, setAdminProfiles] = useState([]);
  const [pending, setPending] = useState([]);
  const [rsvps, setRsvps] = useState([]);
  const [adminAccounts, setAdminAccounts] = useState([]);
  const [notifications, setNotifications] = useState({ count: 0, items: [] });
  const [auditLog, setAuditLog] = useState([]);
  const [analytics, setAnalytics] = useState({ alumni_by_batch: [], profiles_by_college: [], rsvps_by_event: [] });
  const [backupFiles, setBackupFiles] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [filters, setFilters] = useState({ course: '', batch: '', verification: '' });
  const [importFile, setImportFile] = useState(null);
  const [importPreview, setImportPreview] = useState(null);
  const [systemBusy, setSystemBusy] = useState(false);
  const [events, setEvents] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState('');
  const [dialog, setDialog] = useState(null);
  const [dialogBusy, setDialogBusy] = useState(false);
  const [actionModal, setActionModal] = useState(null);
  const [actionModalBusy, setActionModalBusy] = useState(false);
  const [query, setQuery] = useState('');
  const [appFilter, setAppFilter] = useState('ALL');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loginError, setLoginError] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [applicationResult, pendingResult, profileResult, membersResult, rsvpResult, eventResult, galleryResult, courseResult, accountsResult, noticeResult, auditResult, analyticsResult] = await Promise.all([
        getAdminApplications(), getPendingAlumni(), getAdminAlumni(), getAdminBistaaMembers(), getAdminRsvps(), getEvents(), getGallery(), getCourses(), getAdminAccounts(), getAdminNotifications(), getAdminAudit(), getAdminAnalytics(),
      ]);
      setApps(applicationResult.applications || []);
      setPending(pendingResult || []);
      setAdminProfiles(profileResult || []);
      setActiveMemberCount(membersResult?.length || 0);
      setBistaaMembers(membersResult || []);
      setRsvps(rsvpResult || []);
      setEvents(eventResult || []);
      setGallery(galleryResult || []);
      setCourses(courseResult || []);
      setAdminAccounts(accountsResult || []);
      const ownAccount = (accountsResult || []).find(account => account.is_current);
      if (ownAccount?.role) {
        setAdminRole(ownAccount.role);
        sessionStorage.setItem('bgi_admin_role', ownAccount.role);
      }
      if (ownAccount?.department_id) {
        setAdminDeptId(Number(ownAccount.department_id));
        sessionStorage.setItem('bgi_admin_dept_id', String(ownAccount.department_id));
      } else {
        setAdminDeptId(null);
        sessionStorage.removeItem('bgi_admin_dept_id');
      }
      if (ownAccount?.department_name) {
        setAdminDeptName(ownAccount.department_name);
        sessionStorage.setItem('bgi_admin_dept_name', ownAccount.department_name);
      } else {
        setAdminDeptName('');
        sessionStorage.removeItem('bgi_admin_dept_name');
      }
      setNotifications(noticeResult || { count: 0, items: [] });
      setAuditLog(auditResult || []);
      setAnalytics(analyticsResult || { alumni_by_batch: [], profiles_by_college: [], rsvps_by_event: [] });
    } catch (error) {
      if (error.status === 401) {
        sessionStorage.removeItem('bgi_admin_token');
        setToken('');
      }
      showToast?.(error.message || 'Could not load administration data.', 'error');
    } finally { setLoading(false); }
  };

  useEffect(() => { if (token) loadData(); }, [token]);
  useEffect(() => {
    if (token && activeSection === 'system' && adminRole === 'super_admin') getAdminBackups().then(setBackupFiles).catch(error => showToast?.(error.message, 'error'));
  }, [token, activeSection, adminRole]);

  const logout = () => {
    sessionStorage.removeItem('bgi_admin_token');
    sessionStorage.removeItem('bgi_admin_role');
    sessionStorage.removeItem('bgi_admin_dept_id');
    sessionStorage.removeItem('bgi_admin_dept_name');
    setToken(''); setApps([]); setPending([]); setRsvps([]);
    setAdminRole(''); setAdminDeptId(null); setAdminDeptName('');
  };

  const toggleSidebar = () => {
    setHoveredNav(null);
    setSidebarCollapsed(collapsed => {
      localStorage.setItem('bgi_admin_sidebar_collapsed', String(!collapsed));
      return !collapsed;
    });
  };

  const handleLogin = async (event) => {
    event.preventDefault(); setLoginError(''); setLoading(true);
    try {
      const response = await adminLogin(username.trim(), password);
      sessionStorage.setItem('bgi_admin_token', response.access_token);
      sessionStorage.setItem('bgi_admin_role', response.role || 'reviewer');
      setAdminRole(response.role || 'reviewer');
      if (response.department_id) {
        sessionStorage.setItem('bgi_admin_dept_id', String(response.department_id));
        setAdminDeptId(Number(response.department_id));
      } else {
        sessionStorage.removeItem('bgi_admin_dept_id');
        setAdminDeptId(null);
      }
      if (response.department_name) {
        sessionStorage.setItem('bgi_admin_dept_name', response.department_name);
        setAdminDeptName(response.department_name);
      } else {
        sessionStorage.removeItem('bgi_admin_dept_name');
        setAdminDeptName('');
      }
      setToken(response.access_token); setPassword('');
    } catch (error) { setLoginError(error.message || 'Sign in failed.'); }
    finally { setLoading(false); }
  };

  const refresh = async () => {
    await loadData();
    await onDataChanged?.();
  };

  const confirmActionModal = async (value = '') => {
    if (!actionModal || actionModalBusy) return;
    setActionModalBusy(true);
    try {
      const completed = await actionModal.onConfirm(value);
      if (completed) setActionModal(null);
    } catch (error) {
      showToast?.(error.message || 'Action could not be completed.', 'error');
    } finally { setActionModalBusy(false); }
  };

  const executeApplicationReview = async (app, status, reason = '') => {
    setActionId(String(app.id));
    try {
      await reviewAdminApplication(app.id, { status, rejection_reason: reason || undefined });
      await refresh();
      showToast?.(status === 'ACTIVE' ? 'BISTAA membership approved.' : 'Application rejected.', 'success');
      return true;
    } catch (error) { showToast?.(error.message || 'Could not review application.', 'error'); }
    finally { setActionId(''); }
    return false;
  };

  const review = async (app, status) => {
    if (status !== 'REJECTED') return executeApplicationReview(app, status);
    setActionModal({
      title: `Reject ${app.name}'s application?`,
      description: 'This application will be marked rejected and removed from the pending review queue.',
      inputLabel: 'Reason (optional)', inputPlaceholder: 'Add a short reason for the applicant…',
      confirmLabel: 'Reject application', danger: true,
      onConfirm: reason => executeApplicationReview(app, status, reason),
    });
  };

  const setVerification = async (person, verified) => {
    const id = String(person.id).replace(/^alum-/, '');
    setActionId(String(person.id));
    try {
      await setAlumnusVerification(id, verified);
      await refresh();
      showToast?.(verified ? 'Alumni profile verified.' : 'Alumni profile returned to pending review.', 'success');
    } catch (error) { showToast?.(error.message || 'Could not update profile status.', 'error'); }
    finally { setActionId(''); }
  };

  const rejectAlumni = async (person) => {
    setActionModal({
      title: `Reject ${person.firstname} ${person.lastname}?`,
      description: 'This profile will leave the review queue and stay hidden from the public directory. You can restore it from Users.',
      confirmLabel: 'Reject profile', danger: true,
      onConfirm: async () => {
        setActionId(String(person.id));
        try {
          await rejectAdminAlumnus(String(person.id).replace(/^alum-/, ''));
          await refresh();
          showToast?.('Profile rejected and removed from the review queue.', 'success');
          return true;
        } catch (error) { showToast?.(error.message || 'Could not reject this profile.', 'error'); return false; }
        finally { setActionId(''); }
      },
    });
  };

  const submitDialog = async (values, photoTouched = false) => {
    if (!dialog) return;
    setDialogBusy(true);
    let successMessage;
    try {
      if (dialog.kind === 'event') {
        let bannerUrl = values.banner || '';
        if (values.banner_file) {
          const uploadedBanner = await uploadAdminEventBanner(values.banner_file);
          bannerUrl = uploadedBanner.url;
        }
        const payload = {
          title: values.title.trim(),
          subtitle: (values.subtitle || '').trim(),
          description: values.description || '',
          schedule: values.schedule,
          banner: bannerUrl,
          venue: (values.venue || '').trim(),
          event_type: values.event_type || 'HYBRID',
          highlights: values.highlights || '',
          registration_open: values.registration_open === 'true' || values.registration_open === true,
        };
        if (dialog.id) await updateAdminEvent(dialog.id, payload); else await createAdminEvent(payload);
      } else if (dialog.kind === 'course') {
        const payload = { course: values.course, about: values.about || '' };
        if (dialog.id) await updateDepartment(dialog.id, payload); else await createDepartment(payload);
      } else if (dialog.kind === 'gallery') {
        const cleanCategory = (values.category || 'Campus Life').trim() || 'Campus Life';
        if (dialog.id) await updateAdminGalleryItem(dialog.id, { title: values.title.trim(), category: cleanCategory, description: (values.description || '').trim(), sort_order: Number(values.sort_order || 0), featured: values.featured === 'true' || values.featured === true });
        else {
          const form = new FormData();
          form.append('title', values.title.trim()); form.append('category', cleanCategory);
          form.append('description', (values.description || '').trim()); form.append('image', values.image);
          await createAdminGalleryItem(form);
        }
      } else if (dialog.kind === 'account') {
        if (values.role === 'department_hod' && !values.department_id) {
          throw new Error('Please select an assigned department for the Department HOD account.');
        }
        const payload = {
          username: values.username.trim(),
          password: values.password,
          role: values.role || 'reviewer',
          department_id: (values.role === 'department_hod' && values.department_id) ? Number(values.department_id) : null,
        };
        await createAdminAccount(payload);
        successMessage = `Admin account ${payload.username} created.`;
      } else if (dialog.kind === 'account_role') {
        if (values.role === 'department_hod' && !values.department_id) {
          throw new Error('Please select an assigned department for the Department HOD account.');
        }
        const deptId = (values.role === 'department_hod' && values.department_id) ? Number(values.department_id) : null;
        await changeAdminRole(dialog.username, values.role, deptId);
        successMessage = `Access updated for ${dialog.username}.`;
      } else if (dialog.kind === 'password') {
        await resetAdminAccountPassword(dialog.username, values.password);
      } else if (dialog.kind === 'alumni') {
        const { avatar, photo_url: photoUrl } = values;
        if (photoTouched) await updateAdminAlumnusPhoto(dialog.id, { photo_url: photoUrl || '', file: avatar });
        const profileFields = ['firstname', 'lastname', 'email', 'college', 'batch', 'course_id', 'pos', 'connected_to', 'companyloc', 'companysector', 'bio'];
        const profileChanged = profileFields.some(key => String(values[key] ?? '').trim() !== String(dialog.initial?.[key] ?? '').trim());
        if (profileChanged) {
          const payload = {
            firstname: (values.firstname || '').trim(),
            lastname: (values.lastname || '').trim(),
            email: (values.email || '').trim(),
            college: (values.college || '').trim() || 'BIST',
            batch: Number(values.batch),
            course_id: Number(values.course_id),
            pos: (values.pos || '').trim(),
            connected_to: (values.connected_to || '').trim(),
            companyloc: (values.companyloc || '').trim(),
            companysector: (values.companysector || '').trim(),
            bio: (values.bio || '').trim(),
          };
          const result = await updateAdminAlumnus(dialog.id, payload);
          if (result.membership_synced) successMessage = 'Alumni profile and linked BISTAA member synced.';
        }
        if (dialog.verifyAfterSave) {
          await setAlumnusVerification(dialog.id, true);
          successMessage = 'Alumni profile updated and verified.';
        }
      } else if (dialog.kind === 'bistaa-member') {
        const { avatar, photo_url: photoUrl, ...memberValues } = values;
        const profileId = dialog.profileId || values.profile_id || undefined;
        const payload = { ...memberValues, profile_id: profileId, batch: values.batch ? Number(values.batch) : null };
        if (photoTouched && !profileId) throw new Error('Link an alumni profile before adding a profile photo.');
        const memberFields = ['name', 'enrollment', 'membership_id', 'branch', 'college', 'batch', 'email', 'phone', 'employer', 'job_title', 'location', 'sector'];
        const memberChanged = memberFields.some(key => String(values[key] ?? '').trim() !== String(dialog.initial?.[key] ?? '').trim())
          || (!dialog.profileId && String(values.profile_id || '') !== String(dialog.initial?.profile_id || ''));
        // Save the photo first so membership form validation cannot block it,
        // including when an existing profile was selected to link.
        if (photoTouched) await updateAdminAlumnusPhoto(profileId, { photo_url: photoUrl || '', file: avatar });
        if (memberChanged) {
          try { await updateAdminBistaaMember(dialog.id, payload); }
          catch (error) {
            if (photoTouched) throw new Error(`Photo saved, but member details were not saved: ${error.message}`);
            throw error;
          }
        }
      }
      setDialog(null);
      await refresh();
      showToast?.(successMessage || dialog.success || 'Changes saved.', 'success');
    } catch (error) { showToast?.(error.message || 'Could not save changes.', 'error'); }
    finally { setDialogBusy(false); }
  };

  const removeRecord = (kind, row) => {
    const label = kind === 'event' ? row.title : kind === 'course' ? row.course : kind === 'gallery' ? row.title : kind === 'rsvp' ? `${row.attendee_name}'s RSVP` : kind === 'alumni' ? `${row.firstname} ${row.lastname}` : kind === 'application' ? `${row.name}'s application` : row.username;
    setActionModal({
      title: `Delete ${label}?`,
      description: 'This permanently deletes the record and cannot be undone.',
      confirmLabel: 'Delete permanently', danger: true,
      onConfirm: async () => {
        const id = String(row.id ?? row.username);
        setActionId(id);
        try {
          if (kind === 'event') await deleteAdminEvent(row.id);
          if (kind === 'course') await deleteDepartment(row.id);
          if (kind === 'gallery') await deleteAdminGalleryItem(row.id);
          if (kind === 'rsvp') await deleteAdminRsvp(row.id);
          if (kind === 'alumni') await deleteAdminAlumnus(String(row.id).replace(/^alum-/, ''));
          if (kind === 'application') await deleteAdminApplication(row.id);
          if (kind === 'account') await deleteAdminAccount(row.username);
          await refresh();
          showToast?.('Record deleted.', 'success');
          return true;
        } catch (error) { showToast?.(error.message || 'Could not delete record.', 'error'); return false; }
        finally { setActionId(''); }
      },
    });
  };

  const runImportPreview = async (file) => {
    setImportFile(file); setImportPreview(null);
    if (!file) return;
    try { setImportPreview(await previewAlumniImport(file)); }
    catch (error) { showToast?.(error.message || 'CSV preview failed.', 'error'); }
  };
  const runImportCommit = () => {
    if (!importFile || !importPreview?.importable) return;
    setActionModal({
      title: `Import ${importPreview.importable} alumni profiles?`,
      description: 'Imported profiles will be added to the Not Verified Alumni review queue.',
      confirmLabel: 'Import profiles', danger: false,
      onConfirm: async () => {
        setSystemBusy(true);
        try {
          const result = await commitAlumniImport(importFile);
          setImportPreview(null); setImportFile(null); await refresh();
          showToast?.(`${result.imported} alumni profiles imported to the verification queue.`, 'success');
          return true;
        } catch (error) { showToast?.(error.message || 'CSV import failed.', 'error'); return false; }
        finally { setSystemBusy(false); }
      },
    });
  };
  const downloadBackup = async () => {
    setSystemBusy(true);
    try {
      const { blob, filename } = await createDatabaseBackup();
      const url = URL.createObjectURL(blob); const link = document.createElement('a');
      link.href = url; link.download = filename; link.click(); URL.revokeObjectURL(url);
      showToast?.('Database backup downloaded.', 'success');
      getAdminBackups().then(setBackupFiles).catch(() => {});
    } catch (error) { showToast?.(error.message || 'Backup failed.', 'error'); }
    finally { setSystemBusy(false); }
  };
  const restoreBackup = file => {
    if (!file) return;
    setActionModal({
      title: 'Restore database backup?',
      description: 'The current database will be backed up automatically first. The selected backup will then replace its data.',
      confirmLabel: 'Restore backup', danger: true,
      onConfirm: async () => {
        setSystemBusy(true);
        try { const result = await restoreDatabaseBackup(file); await refresh(); getAdminBackups().then(setBackupFiles).catch(() => {}); showToast?.(result.message, 'success'); return true; }
        catch (error) { showToast?.(error.message || 'Restore failed.', 'error'); return false; }
        finally { setSystemBusy(false); }
      },
    });
  };
  const changeRole = async (account, role) => {
    try { await changeAdminRole(account.username, role); await refresh(); showToast?.(`Role updated for ${account.username}.`, 'success'); }
    catch (error) { showToast?.(error.message || 'Could not update role.', 'error'); }
  };

  const openEventDialog = (event = null) => setDialog({ kind: 'event', id: event?.id, title: event ? 'Edit event' : 'Create event', description: 'Manage the event details shown on the public events page.', success: event ? 'Event updated.' : 'Event created.', fields: [
    { name: 'title', label: 'Event name', required: true },
    { name: 'subtitle', label: 'Short heading / subtitle', required: false },
    { name: 'schedule', label: 'Date and time', type: 'datetime-local', required: true },
    { name: 'event_type', label: 'Event format', type: 'select', required: true, options: [
      { value: 'HYBRID', label: 'Hybrid' },
      { value: 'CAMPUS', label: 'On campus' },
      { value: 'VIRTUAL', label: 'Virtual' },
    ] },
    { name: 'registration_open', label: 'RSVP / Registration Status', type: 'select', required: true, options: [
      { value: 'true', label: 'Open (Accept RSVPs)' },
      { value: 'false', label: 'Closed (Disable RSVPs)' },
    ] },
    { name: 'description', label: 'Description', type: 'textarea', wide: true, required: false },
    { name: 'venue', label: 'Venue / meeting link', wide: true, required: false },
    { name: 'highlights', label: 'Event highlights (one per line)', type: 'textarea', wide: true, required: false, help: 'Add each agenda item or highlight on a separate line.' },
    { name: 'banner', label: 'Banner image URL', wide: true, required: false },
  ], initial: event ? {
    title: event.title,
    subtitle: event.subtitle || 'Official BGI Alumni Gathering',
    description: event.description,
    schedule: event.schedule?.replace(' ', 'T').slice(0, 16),
    banner: event.image || '',
    venue: event.venue || 'Bansal Institute of Science & Technology, Bhopal',
    event_type: event.type || 'HYBRID',
    highlights: Array.isArray(event.highlights) ? event.highlights.join('\n') : '',
    registration_open: String(event.registration_open !== false),
  } : {
    subtitle: 'Official BGI Alumni Gathering',
    venue: 'Bansal Institute of Science & Technology, Bhopal',
    event_type: 'HYBRID',
    schedule: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
    registration_open: 'true',
  } });

  const openCourseDialog = (course = null) => setDialog({ kind: 'course', id: course?.id, title: course ? 'Edit department' : 'Add department', description: 'Keep academic department names and descriptions up to date.', success: course ? 'Department updated.' : 'Department added.', fields: [
    { name: 'course', label: 'Department / course name', required: true },
    { name: 'about', label: 'Description', type: 'textarea', wide: true, required: false },
  ], initial: course ? { course: course.course, about: course.about } : {} });

  const openAlumniDialog = (person, { verifyAfterSave = false } = {}) => setDialog({ kind: 'alumni', id: person.id, photoEditor: true, verifyAfterSave, submitLabel: verifyAfterSave ? 'Save changes & verify' : 'Save changes', title: verifyAfterSave ? 'Review & verify alumni profile' : 'Edit alumni profile', description: verifyAfterSave
    ? 'Check the submitted details and correct anything that is wrong. Saving will update the profile and approve it for the alumni directory.'
    : `Update the directory record for ${person.firstname || ''} ${person.lastname || ''}`.trim() + '.', success: 'Alumni profile updated.', fields: [
    { name: 'firstname', label: 'First name', required: true },
    { name: 'lastname', label: 'Last name', required: false },
    { name: 'email', label: 'Email address', type: 'email', required: false },
    { name: 'college', label: 'College', required: true },
    { name: 'batch', label: 'Graduation batch', type: 'number', required: true },
    { name: 'course_id', label: 'Department / course', type: 'select', required: true, options: courses.map(course => ({ value: course.id, label: course.course })) },
    { name: 'pos', label: 'Job title', required: false },
    { name: 'connected_to', label: 'Organization', required: false },
    { name: 'companyloc', label: 'Work location', required: false },
    { name: 'companysector', label: 'Working sector', required: false },
    { name: 'bio', label: 'Professional summary', type: 'textarea', wide: true, required: false },
    { name: 'photo_url', label: 'Profile photo URL', wide: true, required: false, help: 'Use a direct image URL, or leave blank to remove the current photo.' },
    { name: 'avatar', label: 'Upload profile photo (JPG, PNG, WebP; max 5 MB)', type: 'file', accept: 'image/jpeg,image/png,image/webp', wide: true, required: false, help: 'If both a URL and file are provided, the uploaded image is used.' },
  ], initial: { ...person, lastname: person.lastname || '', photo_url: person.photo_url || '', course_id: person.course_id || courses[0]?.id || '' } });

  const openBistaaMemberDialog = member => setDialog({
    kind: 'bistaa-member', id: member.active_member_id, profileId: member.profile_id, photoEditor: true,
    title: 'Edit BISTAA member', description: member.profile_linked
      ? 'Update the lifetime membership record and its linked alumni profile.'
      : 'Update the lifetime membership record. No linked alumni profile was found for this member.',
    success: 'BISTAA member updated.',
    fields: [
      { name: 'name', label: 'Full name', required: true },
      { name: 'enrollment', label: 'Enrollment number', required: true },
      { name: 'membership_id', label: 'Membership ID', required: true },
      { name: 'branch', label: 'Branch / course', required: true },
      ...(!member.profile_linked ? [{
        name: 'profile_id', label: 'Link an existing alumni profile', type: 'select', required: false,
        options: [
          { value: '', label: 'Keep unlinked for now' },
          ...adminProfiles
            .filter(profile => !bistaaMembers.some(existing => existing.profile_id === profile.id))
            .map(profile => ({ value: profile.id, label: `${profile.firstname || ''} ${profile.lastname || ''} · ${profile.enroll_no || 'No enrollment'}`.trim(), profile })),
        ],
        onChange: (profileId) => {
          const profile = adminProfiles.find(item => String(item.id) === String(profileId));
          return profile ? {
            name: `${profile.firstname || ''} ${profile.lastname || ''}`.trim() || member.name || '',
            enrollment: profile.enroll_no || member.enrollment || '',
            college: profile.college || 'BIST', batch: profile.batch || '',
            branch: profile.course || member.branch || '', email: profile.email || '',
            phone: profile.phone_no || '', employer: profile.connected_to || '',
            job_title: profile.pos || '', location: profile.companyloc || '', sector: profile.companysector || '',
            photo_url: profile.photo_url || '',
          } : {
            name: member.name || '', enrollment: member.enrollment || '', branch: member.branch || '',
            college: 'BIST', batch: '', email: '', phone: '', employer: '', job_title: '', location: '', sector: '', photo_url: '',
          };
        },
      }] : []),
      ...[
        { name: 'college', label: 'College', required: true },
        { name: 'batch', label: 'Graduation batch', type: 'number', required: false },
        { name: 'email', label: 'Email address', type: 'email', required: false },
        { name: 'phone', label: 'Phone number', type: 'tel', required: false },
        { name: 'employer', label: 'Organization', required: false },
        { name: 'job_title', label: 'Job title', required: false },
        { name: 'location', label: 'Work location', required: false },
        { name: 'sector', label: 'Working sector', required: false },
        { name: 'photo_url', label: 'Profile photo URL', wide: true, required: false, help: 'Leave blank to remove the existing photo; an uploaded file takes priority.' },
        { name: 'avatar', label: 'Upload profile photo (JPG, PNG, WebP; max 5 MB)', type: 'file', accept: 'image/jpeg,image/png,image/webp', wide: true, required: false },
      ],
    ],
    initial: {
      name: member.name || '', enrollment: member.enrollment || '', membership_id: member.membership_id || '',
      profile_id: '',
      branch: member.branch || '', college: member.college || 'BIST', batch: member.batch || '',
      email: member.email || '', phone: member.phone || '', employer: member.employer || '',
      job_title: member.job_title || '', location: member.location || '', sector: member.sector || '', photo_url: member.photo_url || '',
    },
  });

  const openGalleryDialog = item => {
    const managedId = String(item?.id || '').match(/^managed-(\d+)$/)?.[1];
    const defaultCategories = ['Campus Life', 'Convocation', 'Reunions', 'Awards'];
    const customFromGallery = gallery.map(g => (g.category || '').trim()).filter(Boolean);
    const itemCategory = (item?.category || '').trim();
    const categories = Array.from(new Set([
      ...defaultCategories,
      ...customFromGallery,
      ...(itemCategory ? [itemCategory] : [])
    ]));

    setDialog({ kind: 'gallery', id: managedId, title: managedId ? 'Edit gallery item' : 'Add gallery photo', description: managedId ? 'Update the public photo caption and category.' : 'Upload an image to add it to the public gallery.', success: managedId ? 'Gallery item updated.' : 'Gallery photo added.', fields: [
      { name: 'title', label: 'Photo title', required: true },
      { name: 'category', label: 'Section / category', type: 'category_picker', categories, required: true },
      { name: 'description', label: 'Short description', type: 'textarea', wide: true, required: false },
      ...(managedId ? [{ name: 'sort_order', label: 'Display order', type: 'number', required: true }, { name: 'featured', label: 'Featured photo', type: 'select', options: [{ value: 'false', label: 'No' }, { value: 'true', label: 'Yes' }] }] : []),
      ...(!managedId ? [{ name: 'image', label: 'Image file (JPG, PNG, WebP; max 5 MB)', type: 'file', accept: 'image/jpeg,image/png,image/webp', required: true }] : []),
    ], initial: item ? { title: item.title, category: item.category || 'Campus Life', description: item.description || item.subtitle || '', sort_order: item.sort_order || 0, featured: String(Boolean(item.featured)) } : { category: 'Campus Life' } });
  };

  const verifiedAlumni = adminProfiles.filter(profile => Number(profile.status) === 1);
  const totalRegistered = adminProfiles.length || (alumniList.length + pending.length);
  const activeMembers = activeMemberCount;
  const pendingApplications = apps.filter(app => app.status === 'PENDING_VERIFICATION').length;
  const upcomingEvents = events.filter(event => !event.schedule || new Date(event.schedule) >= new Date()).length;
  const currentNav = NAV.find(item => item.id === activeSection) || NAV[0];
  const isSuperAdmin = adminRole === 'super_admin';
  const isHod = adminRole === 'department_hod';
  const canReview = isSuperAdmin || adminRole === 'reviewer' || isHod;
  const canManageContent = isSuperAdmin || adminRole === 'content_manager';
  const visibleNav = NAV.filter(item => {
    if (isHod) {
      return ['dashboard', 'verified', 'unverified', 'users', 'analytics'].includes(item.id);
    }
    if (item.id === 'access' || item.id === 'system') return isSuperAdmin;
    if (['unverified', 'bistaa'].includes(item.id)) return canReview;
    if (['events', 'gallery', 'departments'].includes(item.id)) return canManageContent;
    return true;
  });
  const visibleNotifications = notifications.items.filter(item => visibleNav.some(navItem => navItem.id === item.section));
  const normalizedQuery = query.trim().toLowerCase();
  const filterRows = rows => rows.filter(row => !normalizedQuery || Object.values(row).some(value => String(value ?? '').toLowerCase().includes(normalizedQuery)));
  const filterProfiles = rows => filterRows(rows).filter(row => (!filters.course || String(row.course_id) === filters.course)
    && (!filters.batch || String(row.batch) === filters.batch)
    && (!filters.verification || ({ 0: 'pending', 1: 'verified', 2: 'rejected' }[Number(row.status)] || 'pending') === filters.verification));
  const filteredApps = useMemo(() => apps.filter(app => (appFilter === 'ALL' || app.status === appFilter)
    && (!normalizedQuery || `${app.name} ${app.enrollment} ${app.branch} ${app.upi_transaction_id}`.toLowerCase().includes(normalizedQuery))), [apps, appFilter, normalizedQuery]);

  const exportAlumni = (list = [...verifiedAlumni, ...pending]) => saveCsv('bgi-alumni.csv', [
    ['Name', 'Enrollment', 'College', 'Course', 'Batch', 'Email', 'Phone', 'Verification'],
    ...list.map(row => [`${row.firstname || ''} ${row.lastname || ''}`.trim(), row.enroll_no, row.college, row.course, row.batch, row.email, row.phone_no, row.status === 0 || pending.some(item => item.id === row.id) ? 'Pending' : 'Verified']),
  ]);
  const exportRsvps = () => saveCsv('bgi-event-rsvps.csv', [
    ['Event', 'Attendee', 'Enrollment', 'Email', 'Guests', 'Pass code', 'Registered'],
    ...rsvps.map(row => [row.event_title, row.attendee_name, row.enrollment_number, row.email, row.guest_count, row.pass_code, row.created_at]),
  ]);

  const markNotificationRead = async (item) => {
    try {
      const updated = await markAdminNotificationRead(item.id);
      setNotifications(updated || { count: 0, items: [] });
      return true;
    } catch (error) {
      showToast?.(error.message || 'Could not mark this notification as read.', 'error');
      return false;
    }
  };

  const openNotification = async (item) => {
    setActiveSection(item.section);
    setQuery('');
    setShowNotifications(false);
    await markNotificationRead(item);
  };

  if (!token) return (
    <main className="admin-login-page">
      <form className="admin-login-panel" onSubmit={handleLogin}>
        <div className="admin-login-brand"><img src={BGI_BHOPAL_LOGO} alt="BGI Bhopal" /><span><b>BGI ALUMENTO</b><small>ADMINISTRATION PORTAL</small></span></div>
        <div className="admin-login-heading"><span className="admin-login-mark"><ShieldCheck size={23} /></span><p className="admin-kicker">SECURE ADMIN ACCESS</p><h1>Welcome back</h1><p className="admin-login-intro">Sign in to manage alumni verification, BISTAA membership, and event records.</p></div>
        <label htmlFor="admin-username">Username</label>
        <input id="admin-username" autoComplete="username" placeholder="Enter your admin username" required value={username} onChange={event => setUsername(event.target.value)} />
        <label htmlFor="admin-password">Password</label>
        <div className="admin-password-field"><input id="admin-password" type={passwordVisible ? 'text' : 'password'} autoComplete="current-password" placeholder="Enter your password" required value={password} onChange={event => setPassword(event.target.value)} /><button type="button" aria-label={passwordVisible ? 'Hide password' : 'Show password'} onClick={() => setPasswordVisible(visible => !visible)}>{passwordVisible ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
        {loginError && <p className="admin-form-error" role="alert">{loginError}</p>}
        <button className="admin-primary-btn admin-login-submit" disabled={loading}><ShieldCheck size={17} />{loading ? 'Signing in…' : 'Sign in securely'}</button>
        <p className="admin-login-footnote">Authorized administrators only · Your session is protected</p>
      </form>
      <p className="admin-login-credit">Designed &amp; Developed by <a href="https://devlinkhub.in" target="_blank" rel="noopener noreferrer">DevLinkHub Team</a></p>
    </main>
  );

  const heading = (title, description, action = null) => (
    <header className="admin-section-heading"><div><p className="admin-kicker">ADMINISTRATION</p><h1>{title}</h1><p>{description}</p></div>{action}</header>
  );
  const sectionAction = <button className="admin-secondary-btn" onClick={refresh} disabled={loading}><RefreshCw size={16} /> Refresh</button>;
  const searchBox = <label className="admin-search"><Search size={17} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search records…" aria-label="Search records" /></label>;

  const updateNavTooltip = (event, label) => {
    if (!sidebarCollapsed) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    setHoveredNav({ label, left: bounds.right + 9, top: bounds.top + bounds.height / 2 });
  };

  const renderDashboard = () => <>
    {heading(
      isHod ? `Welcome, HOD ${adminDeptName || 'Department'}!` : 'Welcome back, BGI!',
      isHod ? `Department overview and verification queue for ${adminDeptName || 'your department'}.` : 'Your alumni network at a glance.',
      sectionAction
    )}
    <div className="admin-metrics-grid">
      <Metric tone="green" label="Verified Alumni" value={verifiedAlumni.length} caption={isHod ? `Verified in ${adminDeptName || 'dept'}` : 'Visible in the directory'} icon={Users} />
      <Metric tone="blue" label="Not Verified Alumni" value={pending.length} caption={isHod ? 'Waiting for your review' : 'Waiting for profile review'} icon={Clock3} />
      <Metric tone="gold" label="Total Registered" value={totalRegistered} caption={isHod ? `All ${adminDeptName || 'dept'} alumni` : 'All submitted alumni profiles'} icon={GraduationCap} />
      {!isHod && <Metric tone="teal" label="Upcoming Events" value={upcomingEvents} caption={`${rsvps.length} total reservations`} icon={CalendarDays} />}
    </div>
    <div className="admin-dashboard-grid">
      <section className="admin-surface">
        <div className="admin-surface-heading">
          <div>
            <h2>Needs attention</h2>
            <p>{isHod ? 'Alumni profiles pending your verification' : 'Records waiting for an administrator'}</p>
          </div>
        </div>
        <button className="admin-task-row" onClick={() => setActiveSection('unverified')}>
          <span className="admin-task-icon admin-task-warn"><Clock3 size={18} /></span>
          <span><b>Alumni profile verification</b><small>{pending.length} profiles to review</small></span>
          <ChevronRight size={18} />
        </button>
        {!isHod && (
          <button className="admin-task-row" onClick={() => { setAppFilter('PENDING_VERIFICATION'); setActiveSection('bistaa'); }}>
            <span className="admin-task-icon admin-task-blue"><ShieldCheck size={18} /></span>
            <span><b>BISTAA payment review</b><small>{pendingApplications} applications to review</small></span>
            <ChevronRight size={18} />
          </button>
        )}
      </section>
      <section className="admin-surface">
        <div className="admin-surface-heading">
          <div>
            <h2>{isHod ? 'Department summary' : 'Network summary'}</h2>
            <p>{isHod ? 'Academic branch overview' : 'Membership and event activity'}</p>
          </div>
          <Activity size={20} />
        </div>
        {isHod ? (
          <>
            <div className="admin-summary-line"><span>Assigned Department</span><strong>{adminDeptName || 'Not assigned'}</strong></div>
            <div className="admin-summary-line"><span>Verified Alumni</span><strong>{verifiedAlumni.length}</strong></div>
            <div className="admin-summary-line"><span>Pending Verification</span><strong>{pending.length}</strong></div>
            <div className="admin-summary-line"><span>Total Registered Students</span><strong>{totalRegistered}</strong></div>
          </>
        ) : (
          <>
            <div className="admin-summary-line"><span>Active BISTAA members</span><strong>{activeMembers}</strong></div>
            <div className="admin-summary-line"><span>Event reservations</span><strong>{rsvps.length}</strong></div>
            <div className="admin-summary-line"><span>Gallery items</span><strong>{gallery.length}</strong></div>
            <div className="admin-summary-line"><span>Departments / courses</span><strong>{courses.length}</strong></div>
          </>
        )}
      </section>
    </div>
    {isHod ? (
      <section className="admin-surface admin-recent">
        <div className="admin-surface-heading">
          <div>
            <h2>Recent Alumni Registrations Waiting for Review</h2>
            <p>Department students awaiting HOD verification</p>
          </div>
          <button className="admin-text-btn" onClick={() => setActiveSection('unverified')}>
            View all ({pending.length}) <ChevronRight size={16} />
          </button>
        </div>
        <Table
          columns={[
            { key: 'firstname', label: 'Student / Alumni', render: row => <span className="admin-person"><b>{row.firstname} {row.lastname}</b><small>{row.email || row.enroll_no}</small></span> },
            { key: 'enroll_no', label: 'Enrollment' },
            { key: 'course', label: 'Department', render: row => row.course || adminDeptName },
            { key: 'batch', label: 'Batch' },
            { key: 'action', label: 'Action', render: row => (
              <div className="admin-row-actions">
                <button className="admin-primary-btn admin-small-btn" disabled={actionId === String(row.id)} onClick={() => verify(row)}>
                  <Check size={14} /> Verify
                </button>
                <button className="admin-secondary-btn admin-small-btn" onClick={() => setActiveSection('unverified')}>
                  Review
                </button>
              </div>
            )},
          ]}
          rows={pending.slice(0, 5)}
          empty="No alumni profiles are waiting for verification in your department."
        />
      </section>
    ) : (
      <section className="admin-surface admin-recent">
        <div className="admin-surface-heading">
          <div>
            <h2>Recent BISTAA applications</h2>
            <p>Latest membership submissions</p>
          </div>
          <button className="admin-text-btn" onClick={() => setActiveSection('bistaa')}>
            View all <ChevronRight size={16} />
          </button>
        </div>
        <Table
          columns={[
            { key: 'name', label: 'Applicant' },
            { key: 'enrollment', label: 'Enrollment' },
            { key: 'submitted_at', label: 'Submitted' },
            { key: 'status', label: 'Status', render: row => <span className={`admin-status admin-status-${row.status.toLowerCase()}`}>{row.status.replaceAll('_', ' ')}</span> },
          ]}
          rows={apps.slice(0, 5)}
          empty="No applications have been submitted."
        />
      </section>
    )}
  </>;

  const renderVerified = () => <>
    {heading('Verified Alumni List', 'Profiles approved and currently visible in the public directory.', <div className="admin-heading-actions"><button className="admin-secondary-btn" onClick={() => exportAlumni(verifiedAlumni)}><Download size={16} /> Export CSV</button>{sectionAction}</div>)}
    <div className="admin-toolbar">{searchBox}<span className="admin-record-count">{filterRows(verifiedAlumni).length} verified profiles</span></div>
    <Table mobileCards columns={[
      { key: 'firstname', label: 'Alumni', render: row => <span className="admin-person"><b>{row.firstname} {row.lastname}</b><small>{row.enroll_no}</small></span> },
      { key: 'college', label: 'College' }, { key: 'course', label: 'Department / course' }, { key: 'batch', label: 'Batch' },
      { key: 'connected_to', label: 'Organization' }, { key: 'companyloc', label: 'Location' },
      ...(canReview ? [{ key: 'actions', label: 'Actions', render: row => <button className="admin-secondary-btn admin-small-btn" onClick={() => openAlumniDialog(row)}>Edit profile</button> }] : []),
    ]} rows={filterRows(verifiedAlumni)} empty="No verified profiles match your search." />
  </>;

  const renderUnverified = () => <>
    {heading('Not Verified Alumni List', 'Review registration details before profiles appear in the directory.', <div className="admin-heading-actions"><button className="admin-secondary-btn" onClick={() => exportAlumni(pending)}><Download size={16} /> Export CSV</button>{sectionAction}</div>)}
    <div className="admin-toolbar">{searchBox}<span className="admin-record-count">{filterRows(pending).length} waiting for review</span></div>
    <Table mobileCards columns={[
      { key: 'firstname', label: 'Alumni', render: row => <span className="admin-person"><b>{row.firstname} {row.lastname}</b><small>{row.enroll_no}</small></span> },
      { key: 'college', label: 'College' }, { key: 'course', label: 'Department / course' }, { key: 'batch', label: 'Batch' },
      ...(canReview ? [{ key: 'email', label: 'Email' }, { key: 'action', label: 'Actions', render: row => <div className="admin-row-actions"><button className="admin-primary-btn admin-small-btn" disabled={actionId === String(row.id)} onClick={() => openAlumniDialog(row, { verifyAfterSave: true })}><Check size={15} /> Verify</button><button className="admin-danger-btn admin-small-btn" disabled={actionId === String(row.id)} onClick={() => rejectAlumni(row)}>{actionId === String(row.id) ? 'Saving…' : <><X size={14} /> Reject</>}</button><button className="admin-secondary-btn admin-small-btn" disabled={actionId === String(row.id)} onClick={() => removeRecord('alumni', row)} aria-label={`Delete ${row.firstname} ${row.lastname}`}><Trash2 size={14} /> Delete</button></div> }] : []),
    ]} rows={filterRows(pending)} empty="No alumni profiles are waiting for verification." />
  </>;

  const renderBistaaMembers = () => {
    const detailScore = member => ['email', 'phone', 'employer', 'job_title', 'location', 'sector', 'batch']
      .reduce((score, key) => score + (String(member[key] ?? '').trim() ? 1 : 0), member.profile_linked ? 1 : 0);
    const filteredMembers = filterRows(bistaaMembers).slice().sort((a, b) =>
      detailScore(b) - detailScore(a) || String(a.name || '').localeCompare(String(b.name || '')),
    );
    const linkedProfiles = bistaaMembers.filter(member => member.profile_linked).length;
    return <>
      {heading('BISTAA Members', 'View active lifetime members and the alumni details linked to each membership.', <div className="admin-heading-actions"><button className="admin-secondary-btn" onClick={() => saveCsv('bistaa-members.csv', [['Name', 'Membership ID', 'Enrollment', 'College', 'Branch / course', 'Batch', 'Employer', 'Job title', 'Location', 'Sector', 'Email', 'Phone', 'Profile status'], ...filteredMembers.map(member => [member.name, member.membership_id, member.enrollment, member.college, member.branch, member.batch, member.employer, member.job_title, member.location, member.sector, member.email, member.phone, member.profile_status])])}><Download size={16} /> Export members</button>{sectionAction}</div>)}
      <div className="admin-toolbar"><div className="admin-search"><Search size={17} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search name, ID, enrollment, organization…" aria-label="Search BISTAA members" /></div><span className="admin-record-count">{filteredMembers.length} members · {linkedProfiles} linked profiles</span></div>
      <Table mobileCards className="admin-bistaa-members-table" columns={[
        { key: 'name', label: 'Member', render: row => <span className="admin-person"><b>{row.name || 'Name unavailable'}</b><small>{row.enrollment || 'Enrollment unavailable'}</small></span> },
        { key: 'membership_id', label: 'Membership ID', render: row => <code className="admin-member-identifier">{row.membership_id || 'Not assigned'}</code> },
        { key: 'college', label: 'College' },
        { key: 'branch', label: 'Branch / course' },
        { key: 'batch', label: 'Batch', render: row => row.batch || '—' },
        { key: 'employer', label: 'Employer / role', render: row => [row.employer, row.job_title].filter(Boolean).join(' · ') || 'Not provided' },
        { key: 'location', label: 'Location', render: row => row.location || 'Not provided' },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Phone' },
        { key: 'profile_status', label: 'Profile', render: row => <span className={`admin-status ${row.profile_status === 'Verified' ? 'admin-status-active' : row.profile_status === 'Rejected' ? 'admin-status-rejected' : 'admin-status-pending_verification'}`}>{row.profile_status}</span> },
        { key: 'actions', label: 'Actions', render: row => <div className="admin-row-actions">{canReview && <button className="admin-secondary-btn admin-small-btn" onClick={() => openBistaaMemberDialog(row)}><Pencil size={14} /> Edit</button>}<button className="admin-secondary-btn admin-small-btn" onClick={() => onOpenDigitalPass?.({ name: row.name, enrollment: row.enrollment, college: row.college, branch: row.branch, membership_id: row.membership_id, photo_url: row.photo_url || row.img_url || row.avatar || '', img_url: row.photo_url || row.img_url || row.avatar || '', avatar: row.photo_url || row.img_url || row.avatar || '' })}>View pass</button></div> },
      ]} rows={filteredMembers} empty="No BISTAA members match your search." />
    </>;
  };

  const renderBistaa = () => <>
    {heading('BISTAA Applications', 'Review payment slips and manage lifetime membership approvals.', <div className="admin-heading-actions"><button className="admin-secondary-btn" onClick={() => saveCsv('bistaa-applications.csv', [['Name', 'Enrollment', 'Branch', 'College', 'UTR', 'Status', 'Membership ID'], ...apps.map(row => [row.name, row.enrollment, row.branch, row.college, row.upi_transaction_id, row.status, row.membership_id])])}><Download size={16} /> Export CSV</button>{sectionAction}</div>)}
    <div className="admin-toolbar admin-toolbar-wrap"><div className="admin-filter-tabs">{['ALL', 'PENDING_VERIFICATION', 'ACTIVE', 'REJECTED'].map(status => <button key={status} className={appFilter === status ? 'is-active' : ''} onClick={() => setAppFilter(status)}>{status === 'ALL' ? `All (${apps.length})` : `${status.replaceAll('_', ' ')} (${apps.filter(app => app.status === status).length})`}</button>)}</div>{searchBox}</div>
    <Table mobileCards columns={[
      { key: 'name', label: 'Applicant', render: row => <span className="admin-person"><b>{row.name}</b><small>{row.enrollment}</small></span> },
      { key: 'branch', label: 'Branch / college', render: row => `${row.branch} · ${row.college}` },
      { key: 'upi_transaction_id', label: 'Payment UTR' }, { key: 'submitted_at', label: 'Submitted' },
      { key: 'slip', label: 'Payment slip', render: row => row.has_transaction_slip ? <button className="admin-text-btn" onClick={() => onOpenSlip?.({ id: row.id, appId: row.id, name: row.name, enrollment: row.enrollment, branch: row.branch, college: row.college, utr: row.upi_transaction_id, status: row.status })}>View slip</button> : 'Not uploaded' },
      { key: 'status', label: 'Status', render: row => <span className={`admin-status admin-status-${row.status.toLowerCase()}`}>{row.status.replaceAll('_', ' ')}</span> },
      { key: 'actions', label: 'Actions', render: row => <div className="admin-row-actions">
        {canReview && row.status === 'PENDING_VERIFICATION' && <>
          <button className="admin-primary-btn admin-small-btn" disabled={actionId === String(row.id)} onClick={() => review(row, 'ACTIVE')}><Check size={14} /> Approve</button>
          <button className="admin-danger-btn admin-small-btn" disabled={actionId === String(row.id)} onClick={() => review(row, 'REJECTED')}><X size={14} /> Reject</button>
        </>}
        {row.status === 'ACTIVE' && <>
          <button className="admin-secondary-btn admin-small-btn" onClick={() => onOpenDigitalPass?.(row)}>View pass</button>
          {canReview && <button className="admin-danger-btn admin-small-btn" disabled={actionId === String(row.id)} onClick={() => review(row, 'REJECTED')}><X size={14} /> Reject</button>}
        </>}
        {canReview && row.status === 'REJECTED' && <>
          <button className="admin-secondary-btn admin-small-btn" onClick={() => review(row, 'ACTIVE')}>Approve</button>
          <button className="admin-danger-btn admin-small-btn" onClick={() => removeRecord('application', row)}><Trash2 size={14} /> Delete</button>
        </>}
      </div> },
    ]} rows={filteredApps} empty="No membership applications match this filter." />
  </>;

  const renderRsvps = () => <>
    {heading('Event RSVPs', 'View attendee reservations and their generated entry pass codes.', <div className="admin-heading-actions"><button className="admin-secondary-btn" onClick={exportRsvps}><Download size={16} /> Export CSV</button>{sectionAction}</div>)}
    <div className="admin-toolbar">{searchBox}<span className="admin-record-count">{filterRows(rsvps).length} reservations</span></div>
    <Table mobileCards columns={[
      { key: 'attendee_name', label: 'Attendee', render: row => <span className="admin-person"><b>{row.attendee_name}</b><small>{row.enrollment_number}</small></span> },
      { key: 'event_title', label: 'Event' }, { key: 'email', label: 'Email' }, { key: 'guest_count', label: 'Guests' },
      { key: 'pass_code', label: 'Pass code' }, { key: 'created_at', label: 'Registered' },
      ...(canReview ? [{ key: 'actions', label: 'Actions', render: row => <button className="admin-danger-btn admin-small-btn" disabled={actionId === String(row.id)} onClick={() => removeRecord('rsvp', row)}><X size={14} /> Cancel RSVP</button> }] : []),
    ]} rows={filterRows(rsvps)} empty="No event RSVPs have been recorded yet." />
  </>;

  const renderEvents = () => <>
    {heading('Events', 'Create, update, and remove events published on the alumni portal.', <div className="admin-heading-actions">{canManageContent && <button className="admin-primary-btn" onClick={() => openEventDialog()}><CalendarDays size={16} /> Create event</button>}{sectionAction}</div>)}
    {events.length ? <div className="admin-card-grid">{events.map(event => {
      const isPast = event.is_past ?? (event.schedule ? new Date(event.schedule) < new Date() : false);
      const isRegOpen = event.registration_open !== false;
      return <article className="admin-content-card" key={event.id}>
        <div className="admin-content-image"><ImageWithPlaceholder src={event.image} alt="" placeholderLabel="Event image" /></div>
        <div className="admin-content-body">
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
            <span className="admin-tag">{event.category || 'Gathering'}</span>
            {isPast ? (
              <span className="admin-tag" style={{ background: '#f1f5f9', color: '#64748b' }}>Concluded (Past)</span>
            ) : !isRegOpen ? (
              <span className="admin-tag" style={{ background: '#fef2f2', color: '#b91c1c' }}>RSVP Closed</span>
            ) : (
              <span className="admin-tag" style={{ background: '#ecfdf5', color: '#047857' }}>RSVP Open</span>
            )}
          </div>
          <h2>{event.title}</h2>
          <p>{event.description || event.subtitle}</p>
          <div className="admin-summary-line"><span>Date</span><strong>{event.date || 'To be announced'}</strong></div>
          <div className="admin-summary-line"><span>RSVP Status</span><strong style={{ color: isPast ? '#64748b' : !isRegOpen ? '#b91c1c' : '#047857' }}>{isPast ? 'Closed (Past event)' : !isRegOpen ? 'Closed by admin' : 'Open'}</strong></div>
          <div className="admin-summary-line"><span>Reservations</span><strong>{event.registered || 0}</strong></div>
          {canManageContent && <div className="admin-card-actions"><button className="admin-secondary-btn admin-small-btn" onClick={() => openEventDialog(event)}>Edit event</button><button className="admin-danger-btn admin-small-btn" disabled={actionId === String(event.id)} onClick={() => removeRecord('event', event)}>Delete</button></div>}
        </div>
      </article>;
    })}</div> : <div className="admin-empty">No events are available.</div>}
  </>;

  const renderGallery = () => <>
    {heading('Gallery', 'Upload and manage photo sections shown on the public site.', <div className="admin-heading-actions">{canManageContent && <button className="admin-primary-btn" onClick={() => openGalleryDialog()}><FileImage size={16} /> Add photo</button>}{sectionAction}</div>)}
    {gallery.length ? <div className="admin-gallery-grid">{gallery.map(item => { const managed = String(item.id).startsWith('managed-'); return <article className="admin-gallery-card" key={item.id}><ImageWithPlaceholder src={item.image} alt={item.title || 'Gallery image'} placeholderLabel="Image unavailable" />{item.featured && <span className="admin-featured-badge">Featured</span>}<div><b>{item.title || 'Campus memory'}</b><small>{item.category || 'Gallery'}{Number.isFinite(item.sort_order) ? ` · Order ${item.sort_order}` : ''}</small>{canManageContent && <div className="admin-card-actions">{managed && <button className="admin-secondary-btn admin-small-btn" onClick={() => openGalleryDialog(item)}>Edit</button>}<button className="admin-danger-btn admin-small-btn" onClick={() => removeRecord('gallery', { ...item, id: String(item.id).replace('managed-', '') })}>Delete</button></div>}</div></article>; })}</div> : <div className="admin-empty">No gallery photos are available.</div>}
  </>;

  const renderDepartments = () => <>
    {heading('Departments', 'Add or update academic programs. Programs linked to alumni cannot be deleted.', <div className="admin-heading-actions">{canManageContent && <button className="admin-primary-btn" onClick={() => openCourseDialog()}><GraduationCap size={16} /> Add department</button>}{sectionAction}</div>)}
    <div className="admin-department-grid">{courses.map(course => <article className="admin-department-card" key={course.id}><span className="admin-department-mark">{String(course.course || 'D').slice(0, 1).toUpperCase()}</span><div><h2>{course.course}</h2><p>{course.about || 'Academic program at Bansal Institute of Science & Technology.'}</p>{canManageContent && <div className="admin-card-actions"><button className="admin-secondary-btn admin-small-btn" onClick={() => openCourseDialog(course)}>Edit</button><button className="admin-danger-btn admin-small-btn" onClick={() => removeRecord('course', course)}>Delete</button></div>}</div></article>)}</div>
    {!courses.length && <div className="admin-empty">No departments or courses are available.</div>}
  </>;

  const renderUsers = () => <>
    {heading('Users', 'Alumni accounts and profile verification status. Search, filter, import, and export records.', <div className="admin-heading-actions">{canReview && <label className="admin-secondary-btn admin-file-button"><Download size={16} /> Import CSV<input type="file" accept=".csv,text/csv" onChange={event => runImportPreview(event.target.files?.[0])} /></label>}<button className="admin-secondary-btn" onClick={() => exportAlumni(adminProfiles)}><Download size={16} /> Export CSV</button>{sectionAction}</div>)}
    <div className="admin-toolbar admin-advanced-filters">{searchBox}<select aria-label="Filter by department" value={filters.course} onChange={event => setFilters(old => ({ ...old, course: event.target.value }))}><option value="">All departments</option>{courses.map(course => <option key={course.id} value={course.id}>{course.course}</option>)}</select><select aria-label="Filter by graduation batch" value={filters.batch} onChange={event => setFilters(old => ({ ...old, batch: event.target.value }))}><option value="">All batches</option>{[...new Set(adminProfiles.map(row => String(row.batch)))].sort((a, b) => b - a).map(batch => <option key={batch} value={batch}>{batch}</option>)}</select><select aria-label="Filter by verification" value={filters.verification} onChange={event => setFilters(old => ({ ...old, verification: event.target.value }))}><option value="">All verification statuses</option><option value="verified">Verified</option><option value="pending">Pending</option><option value="rejected">Rejected</option></select><span className="admin-record-count">{filterProfiles(adminProfiles).length} / {totalRegistered} profiles</span></div>
    {importPreview && <section className="admin-surface admin-import-preview"><div className="admin-surface-heading"><div><h2>CSV import preview</h2><p>{importPreview.importable} of {importPreview.total} rows are ready; imported profiles enter the verification queue.</p></div><button className="admin-dialog-close" onClick={() => { setImportPreview(null); setImportFile(null); }} aria-label="Close preview"><X size={18} /></button></div><div className="admin-import-issues">{Object.entries(importPreview.issues || {}).filter(([, count]) => count > 0).map(([issue, count]) => <span key={issue}>{issue.replaceAll('_', ' ')}: <b>{count}</b></span>)}</div><div className="admin-table-wrap"><table className="admin-data-table"><thead><tr><th>Name</th><th>Enrollment</th><th>Course</th><th>Issue</th></tr></thead><tbody>{importPreview.preview.map((row, index) => <tr key={`${row.enroll_no}-${index}`}><td>{row.firstname} {row.lastname}</td><td>{row.enroll_no}</td><td>{row.course}</td><td>{row._issues || 'Ready'}</td></tr>)}</tbody></table></div><button className="admin-primary-btn admin-import-commit" disabled={!importPreview.importable || systemBusy} onClick={runImportCommit}>{systemBusy ? 'Importing…' : `Import ${importPreview.importable} valid rows`}</button></section>}
    <Table mobileCards columns={[
      { key: 'firstname', label: 'User', render: row => <span className="admin-person"><b>{row.firstname} {row.lastname}</b><small>{row.email || row.enroll_no}</small></span> },
      { key: 'enroll_no', label: 'Enrollment' }, { key: 'college', label: 'College' }, { key: 'course', label: 'Course' },
      { key: 'batch', label: 'Batch' }, { key: 'verification', label: 'Verification', render: row => { const state = Number(row.status) === 1 ? 'VERIFIED' : Number(row.status) === 2 ? 'REJECTED' : 'NOT VERIFIED'; return <span className={`admin-status ${state === 'VERIFIED' ? 'admin-status-active' : state === 'REJECTED' ? 'admin-status-rejected' : 'admin-status-pending_verification'}`}>{state}</span>; } },
      ...(canReview ? [{ key: 'actions', label: 'Actions', render: row => { const state = Number(row.status); return <div className="admin-row-actions"><button className="admin-secondary-btn admin-small-btn" onClick={() => openAlumniDialog(row)}>Edit</button>{state === 0 ? <button className="admin-primary-btn admin-small-btn" disabled={actionId === String(row.id)} onClick={() => setVerification(row, true)}>Verify</button> : state === 2 ? <button className="admin-secondary-btn admin-small-btn" disabled={actionId === String(row.id)} onClick={() => setVerification(row, false)}>Restore to pending</button> : <button className="admin-secondary-btn admin-small-btn" disabled={actionId === String(row.id)} onClick={() => setVerification(row, false)}>Return to pending</button>}</div>; } }] : []),
    ]} rows={filterProfiles(adminProfiles)} empty="No users match your filters." />
  </>;

  const renderAccess = () => <>
    {heading('Admin Accounts', 'Create accounts and assign only the access each teammate needs.', <div className="admin-heading-actions"><button className="admin-primary-btn" onClick={() => setDialog({
      kind: 'account',
      title: 'Create admin account',
      description: 'Use Department HOD for faculty who should only verify their department’s students, or another role as needed.',
      fields: [
        { name: 'username', label: 'Username', required: true },
        { name: 'password', label: 'Password (minimum 8 characters)', type: 'password', minLength: 8, required: true },
        {
          name: 'role',
          label: 'Role',
          type: 'select',
          options: [
            { value: 'department_hod', label: 'Department HOD (Scoped to Department)' },
            { value: 'reviewer', label: 'Reviewer' },
            { value: 'content_manager', label: 'Content manager' },
            { value: 'read_only', label: 'Read only' },
            { value: 'super_admin', label: 'Super admin' },
          ],
          onChange: role => role === 'department_hod' ? {} : { department_id: '' },
        },
        {
          name: 'department_id',
          label: 'Assigned Department (Required for HOD)',
          type: 'select',
          visibleWhen: values => values.role === 'department_hod',
          options: [
            { value: '', label: '-- Select Department (HOD) --' },
            ...courses.map(course => ({ value: String(course.id), label: course.course })),
          ],
        },
      ],
      initial: { role: 'department_hod', department_id: courses[0] ? String(courses[0].id) : '' },
    })}><Users size={16} /> Add administrator</button>{sectionAction}</div>)}
    <div className="admin-access-note"><ShieldCheck size={18} /><span>Passwords are securely hashed before storage. At least one admin account must remain active.</span></div>
    <Table mobileCards columns={[
      { key: 'username', label: 'Administrator', render: row => <span className="admin-person"><b>{row.username}</b><small>{row.is_current ? 'Signed-in account' : (row.role === 'department_hod' ? 'Department HOD' : 'Administrator account')}</small></span> },
      { key: 'role', label: 'Role', render: row => {
        const roleLabels = {
          super_admin: 'Super admin',
          department_hod: 'Department HOD',
          reviewer: 'Reviewer',
          content_manager: 'Content manager',
          read_only: 'Read only',
        };
        return <span className={`admin-status ${row.role === 'super_admin' ? 'admin-status-active' : row.role === 'department_hod' ? 'bg-sky-50 text-sky-800 border-sky-300' : 'admin-status-pending_verification'}`}>{roleLabels[row.role] || row.role}</span>;
      }},
      { key: 'department', label: 'Assigned Department', render: row => row.role === 'department_hod' ? (row.department_name ? <span className="font-semibold text-sky-800 bg-sky-50 px-2 py-0.5 rounded text-xs border border-sky-200">{row.department_name}</span> : <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-xs border border-amber-200 font-medium">Unassigned</span>) : <span className="text-slate-400 text-xs">All Departments</span> },
      { key: 'created_at', label: 'Created' },
      { key: 'actions', label: 'Account controls', render: row => <div className="admin-row-actions">
        {!row.is_current && <button className="admin-secondary-btn admin-small-btn" onClick={() => setDialog({
          kind: 'account_role',
          username: row.username,
          title: `Edit access: ${row.username}`,
          description: 'Change role or assign academic department for this account.',
          fields: [
            {
              name: 'role',
              label: 'Role',
              type: 'select',
              options: [
                { value: 'department_hod', label: 'Department HOD (Scoped to Department)' },
                { value: 'reviewer', label: 'Reviewer' },
                { value: 'content_manager', label: 'Content manager' },
                { value: 'read_only', label: 'Read only' },
                { value: 'super_admin', label: 'Super admin' },
              ],
              onChange: role => role === 'department_hod' ? {} : { department_id: '' },
            },
            {
              name: 'department_id',
              label: 'Assigned Department (Required for HOD)',
              type: 'select',
              visibleWhen: values => values.role === 'department_hod',
              options: [
                { value: '', label: '-- Select Department (HOD) --' },
                ...courses.map(course => ({ value: String(course.id), label: course.course })),
              ],
            },
          ],
          initial: { role: row.role, department_id: row.department_id ? String(row.department_id) : '' },
        })}>Edit access</button>}
        <button className="admin-secondary-btn admin-small-btn" onClick={() => setDialog({ kind: 'password', username: row.username, title: 'Reset administrator password', description: `Set a new sign-in password for ${row.username}.`, fields: [{ name: 'password', label: 'New password (minimum 8 characters)', type: 'password', minLength: 8, required: true }] })}>Reset password</button>
        {!row.is_current && <button className="admin-danger-btn admin-small-btn" onClick={() => removeRecord('account', row)}>Remove</button>}
      </div> },
    ]} rows={adminAccounts} empty="No admin accounts were found." />
  </>;

  const renderAnalytics = () => {
    const bars = (title, rows, labelKey) => { const peak = Math.max(1, ...rows.map(row => Number(row.total ?? row.rsvps) || 0)); return <section className="admin-surface"><div className="admin-surface-heading"><div><h2>{title}</h2><p>Current imported database totals</p></div></div>{rows.length ? <div className="admin-chart-list">{rows.map((row, index) => { const value = Number(row.total ?? row.rsvps) || 0; return <div className="admin-chart-row" key={`${row[labelKey]}-${index}`}><span title={row[labelKey]}>{row[labelKey]}</span><div><i style={{ width: `${Math.max(3, value / peak * 100)}%` }} /></div><b>{value}</b></div>; })}</div> : <div className="admin-empty">No records to chart yet.</div>}</section>; };
    return <>
      {heading('Reports & Analytics', 'Quick snapshots from alumni, college, and event records.', <div className="admin-heading-actions"><button className="admin-secondary-btn" onClick={() => saveCsv('bgi-alumni-by-batch.csv', [['Batch', 'Verified alumni'], ...analytics.alumni_by_batch.map(row => [row.batch, row.total])])}><Download size={16} /> Export report</button>{sectionAction}</div>)}
      <div className="admin-analytics-grid">{bars('Verified alumni by batch', analytics.alumni_by_batch, 'batch')}{bars('Profiles by college', analytics.profiles_by_college, 'college')}{bars('RSVPs by event', analytics.rsvps_by_event, 'title')}</div>
    </>;
  };

  const renderAudit = () => <>
    {heading('Activity Log', 'Review administrator actions and recent changes.', sectionAction)}
    <Table mobileCards columns={[
      { key: 'created_at', label: 'Time' }, { key: 'actor', label: 'Administrator' }, { key: 'action', label: 'Action' },
      { key: 'entity_type', label: 'Record type' }, { key: 'entity_id', label: 'Record' }, { key: 'details', label: 'Details' },
    ]} rows={auditLog} empty="Admin actions will appear here as changes are made." />
  </>;

  const renderSystem = () => <>
    {heading('Backup & Restore', 'Protect your local SQLite database and restore from a verified backup.', sectionAction)}
    <div className="admin-system-grid"><section className="admin-surface"><div className="admin-system-icon"><Download size={22} /></div><h2>Download a database backup</h2><p>Creates a consistent SQLite snapshot without stopping the API. Keep the downloaded file private.</p><button className="admin-primary-btn" disabled={systemBusy} onClick={downloadBackup}>{systemBusy ? 'Working…' : 'Create and download backup'}</button></section><section className="admin-surface"><div className="admin-system-icon"><ShieldCheck size={22} /></div><h2>Restore a backup</h2><p>The uploaded file is integrity-checked. A safety copy of the current database is created before replacing it.</p><label className="admin-secondary-btn admin-file-button">Choose SQLite backup<input type="file" accept=".sqlite,.sqlite3,.db,application/vnd.sqlite3" disabled={systemBusy} onChange={event => restoreBackup(event.target.files?.[0])} /></label></section></div>
    <section className="admin-surface admin-backup-list"><div className="admin-surface-heading"><div><h2>Available backups</h2><p>Automatic daily snapshots are retained for 14 days.</p></div></div><Table columns={[{ key: 'name', label: 'Backup file' }, { key: 'modified', label: 'Created' }, { key: 'size', label: 'Size', render: row => `${(row.size / 1024 / 1024).toFixed(2)} MB` }, { key: 'action', label: 'Action', render: row => <button className="admin-secondary-btn admin-small-btn" onClick={async () => { try { const blob = await downloadSavedBackup(row.name); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = row.name; link.click(); URL.revokeObjectURL(url); } catch (error) { showToast?.(error.message, 'error'); } }}>Download</button> }]} rows={backupFiles} empty="No backup files yet. A daily snapshot is created after the API starts." /></section>
    <p className="admin-system-footnote">Database restore applies to the local SQLite backend. It does not restore uploaded image files or payment slips.</p>
  </>;

  const contentBySection = { dashboard: renderDashboard, gallery: renderGallery, verified: renderVerified, unverified: renderUnverified, events: renderEvents, departments: renderDepartments, users: renderUsers, access: renderAccess, 'bistaa-members': renderBistaaMembers, bistaa: renderBistaa, rsvps: renderRsvps, analytics: renderAnalytics, audit: renderAudit, system: renderSystem };

  return (
    <main className={`admin-app-shell${sidebarCollapsed ? ' admin-sidebar-collapsed' : ''}`}>
      <aside className={`admin-sidebar${mobileNavOpen ? ' admin-sidebar-open' : ''}`}>
        <div className="admin-brand"><span className="admin-brand-mark admin-brand-logo"><img src={BGI_BHOPAL_LOGO} alt="BGI Bhopal logo" /></span><span><b>BGI ALUMENTO</b><small>ADMIN CONSOLE</small></span><button className="admin-mobile-close" aria-label="Close menu" onClick={() => setMobileNavOpen(false)}><X size={20} /></button></div>
        <nav className="admin-side-nav" aria-label="Administration sections">
          <p className="admin-nav-label">WORKSPACE</p>
          {visibleNav.map(item => { const Icon = item.icon; return <button key={item.id} aria-label={item.label} className={activeSection === item.id ? 'is-active' : ''} onMouseEnter={event => updateNavTooltip(event, item.label)} onMouseLeave={() => setHoveredNav(null)} onFocus={event => updateNavTooltip(event, item.label)} onBlur={() => setHoveredNav(null)} onClick={() => { setHoveredNav(null); setActiveSection(item.id); setQuery(''); setMobileNavOpen(false); }}><Icon size={18} /><span>{item.label}</span>{item.id === 'unverified' && pending.length > 0 && <b className="admin-nav-count">{pending.length}</b>}</button>; })}
        </nav>
        <div className="admin-sidebar-bottom"><span className="admin-session-dot" /><span><b>{isHod ? `HOD · ${adminDeptName || 'Dept'}` : 'Administrator'}</b><small>{isHod ? 'Department Portal' : 'Secure session active'}</small></span><button aria-label="Sign out" title="Sign out" onClick={logout}><LogOut size={17} /></button></div>
      </aside>
      {sidebarCollapsed && hoveredNav && <div className="admin-nav-tooltip" role="tooltip" style={{ left: hoveredNav.left, top: hoveredNav.top }}>{hoveredNav.label}</div>}
      {mobileNavOpen && <button className="admin-mobile-scrim" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)} />}
      <section className="admin-main-area">
        <header className="admin-topbar"><button className="admin-mobile-menu" aria-label="Open navigation" onClick={() => setMobileNavOpen(true)}><Menu size={22} /></button><button className="admin-desktop-collapse" aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} onClick={toggleSidebar}>{sidebarCollapsed ? <PanelLeftOpen size={19} /> : <PanelLeftClose size={19} />}</button><div className="admin-top-brand"><span className="admin-brand-mark admin-brand-logo"><img src={BGI_BHOPAL_LOGO} alt="BGI Bhopal logo" /></span><b>BGI ALUMENTO</b></div><div className="admin-breadcrumb"><span>Admin</span>{isHod && adminDeptName && <span className="admin-dept-tag font-semibold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-xs">Dept: {adminDeptName}</span>}<ChevronRight size={15} /><b>{currentNav.label}</b></div><div className="admin-top-actions">{isHod && adminDeptName && <span className="admin-hod-pill hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-sky-800 bg-sky-50 border border-sky-200 rounded-lg"><GraduationCap size={14} className="text-sky-600" /><span>HOD: {adminDeptName}</span></span>}<div className="admin-notification-wrap"><button className={`admin-refresh-icon${visibleNotifications.length ? ' has-notices' : ''}`} aria-label={`${visibleNotifications.reduce((total, item) => total + item.count, 0)} unread admin notifications`} onClick={() => setShowNotifications(value => !value)}><Bell size={17} />{visibleNotifications.length > 0 && <b>{visibleNotifications.reduce((total, item) => total + item.count, 0)}</b>}</button>{showNotifications && <div className="admin-notification-popover"><div className="admin-notification-title"><span>Notifications</span><button onClick={() => setShowNotifications(false)} aria-label="Close notifications"><X size={15} /></button></div>{visibleNotifications.length ? visibleNotifications.map(item => <div className="admin-notification-item" key={item.id}><button className="admin-notification-open" onClick={() => openNotification(item)}><span>{item.title}</span><b>{item.count}</b></button><button className="admin-notification-read" title="Mark as read" aria-label={`Mark ${item.title} as read`} onClick={() => markNotificationRead(item)}><Check size={15} /></button></div>) : <p className="admin-notifications-empty">You’re all caught up.</p>}</div>}</div><button className="admin-refresh-icon" onClick={refresh} aria-label="Refresh data" disabled={loading}><RefreshCw size={17} /></button></div></header>
        <div className="admin-page-content">{loading && <div className="admin-loading-bar" role="status">Updating records…</div>}{(contentBySection[activeSection] || renderDashboard)()}</div>
        <footer className="admin-footer">BGI Alumento administration <span>•</span> Changes are recorded in the local database <span>•</span> Designed &amp; Developed by <a href="https://devlinkhub.in" target="_blank" rel="noopener noreferrer"><strong>DevLinkHub Team</strong></a></footer>
      </section>
      <AdminDialog dialog={dialog} onClose={() => setDialog(null)} onSubmit={submitDialog} busy={dialogBusy} showToast={showToast} />
      <AdminActionModal modal={actionModal} onClose={() => setActionModal(null)} onConfirm={confirmActionModal} busy={actionModalBusy} />
    </main>
  );
}
