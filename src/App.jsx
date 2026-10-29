import React, { lazy, Suspense, useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Toast from './components/Toast';
import SlipPreviewModal from './components/SlipPreviewModal';
import DigitalPassModal from './components/DigitalPassModal';
import RsvpModal from './components/RsvpModal';
import { preloadMemberQr } from './utils/memberIdentityQr';

// Page bundles are loaded only when their route is visited.
const HomePage = lazy(() => import('./pages/HomePage'));
const DirectoryPage = lazy(() => import('./pages/DirectoryPage'));
const BistaaPage = lazy(() => import('./pages/BistaaPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const StatusPage = lazy(() => import('./pages/StatusPage'));
const ActiveMembersPage = lazy(() => import('./pages/ActiveMembersPage'));
const EventsPage = lazy(() => import('./pages/EventsPage'));
const GalleryPage = lazy(() => import('./pages/GalleryPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));

import { clearPublicDataCache, getAdminSlipUrl, getCachedPublicBootstrap, getPublicBootstrap, getAlumni, submitBistaaApplication, submitRegistration, createRsvp } from './api';

const AVAILABLE_VIEWS = new Set([
  'home', 'directory', 'bistaa', 'register', 'status',
  'active-members', 'events', 'gallery', 'admin'
]);

const VIEW_PATHS = {
  home: '/',
  directory: '/directory',
  'active-members': '/bistaa',
  bistaa: '/bistaa-registration',
  register: '/register',
  status: '/status',
  events: '/events',
  gallery: '/gallery',
  admin: '/admin',
};

const getViewFromLocation = () => {
  const path = window.location.pathname.replace(/\/+$/, '').toLowerCase() || '/';
  const pathView = Object.entries(VIEW_PATHS).find(([, route]) => route === path)?.[0];
  if (pathView) return pathView;
  if (path === '/active-members') return 'active-members';
  if (path === '/membership' || path === '/bistaa/register') return 'bistaa';

  // Read old hash URLs once, then replace them with their clean route.
  const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
  if (hash === 'bistaa') return 'active-members';
  return AVAILABLE_VIEWS.has(hash) ? hash : 'home';
};

export default function App() {
  // Navigation State
  const [currentView, setCurrentViewState] = useState(getViewFromLocation);
  const setCurrentView = (view) => {
    if (!AVAILABLE_VIEWS.has(view)) return;
    setCurrentViewState(view);
    const nextPath = VIEW_PATHS[view];
    if (window.location.pathname !== nextPath || window.location.hash) {
      window.history.pushState({}, '', nextPath);
    }
  };

  // Live data is loaded from the FastAPI backend; public data stays in the database.
  const cachedBootstrap = getCachedPublicBootstrap();
  const [alumniList, setAlumniList] = useState(cachedBootstrap?.alumni || []);
  const [membersList, setMembersList] = useState(cachedBootstrap?.members || []);
  const [eventsList, setEventsList] = useState(cachedBootstrap?.events || []);
  const [galleryList, setGalleryList] = useState(cachedBootstrap?.gallery || []);
  const [dataLoading, setDataLoading] = useState(!cachedBootstrap);
  const [apiUnavailable, setApiUnavailable] = useState(false);
  const [reloadDataKey, setReloadDataKey] = useState(0);
  const retryLoaderUntil = useRef(0);

  // Modals & Overlay State
  const [slipPreviewData, setSlipPreviewData] = useState(null);
  const [digitalPassData, setDigitalPassData] = useState(null);
  const [rsvpEventData, setRsvpEventData] = useState(null);

  // Toast Stack
  const [toasts, setToasts] = useState([]);

  // Keep document title and canonical route in sync with the selected page.
  useEffect(() => {
    const titles = {
      home: 'BGI ALUMENTO | Bansal Alumni Association (BISTAA)',
      directory: 'Alumni Directory | BGI ALUMENTO',
      bistaa: 'BISTAA Lifetime Membership (₹300) | BGI ALUMENTO',
      register: 'Standard Alumni Registration | BGI ALUMENTO',
      status: 'Check Registration Status | BGI ALUMENTO',
      'active-members': 'BISTAA Active Lifetime Members | BGI ALUMENTO',
      events: 'Campus Events & Reunions | BGI ALUMENTO',
      gallery: 'Campus Nostalgia Gallery | BGI ALUMENTO',
      admin: 'Admin Verification Console | BGI ALUMENTO'
    };
    document.title = titles[currentView] || 'BGI ALUMENTO';
  }, [currentView]);

  // Warm the QR generator while the member/status page is being viewed,
  // so opening a digital pass does not wait for its code chunk to download.
  useEffect(() => {
    if (currentView === 'active-members' || currentView === 'status') {
      preloadMemberQr().catch(() => {});
    }
  }, [currentView]);

  // Preload the BISTAA directory chunk during browser idle time so first navigation
  // does not have to wait for the route bundle to download.
  useEffect(() => {
    let idleHandle;
    let timeoutHandle;
    const preload = () => {
      import('./pages/ActiveMembersPage').catch(() => {});
      preloadMemberQr().catch(() => {});
    };
    if ('requestIdleCallback' in window) idleHandle = window.requestIdleCallback(preload, { timeout: 1800 });
    else timeoutHandle = window.setTimeout(preload, 900);
    return () => {
      if (idleHandle != null && 'cancelIdleCallback' in window) window.cancelIdleCallback(idleHandle);
      if (timeoutHandle != null) window.clearTimeout(timeoutHandle);
    };
  }, []);

  // Support direct links, legacy hash links, and browser back/forward.
  useEffect(() => {
    const canonicalPath = VIEW_PATHS[getViewFromLocation()];
    if (window.location.pathname !== canonicalPath || window.location.hash) {
      window.history.replaceState({}, '', canonicalPath);
    }

    const handlePopState = () => {
      setCurrentViewState(getViewFromLocation());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Toast Trigger Helper
  const showToast = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  useEffect(() => {
    let cancelled = false;
    getPublicBootstrap()
      .then(async ({ alumni, members, events, gallery }) => {
        const remainingLoaderTime = Math.max(0, retryLoaderUntil.current - Date.now());
        if (remainingLoaderTime) await new Promise(resolve => window.setTimeout(resolve, remainingLoaderTime));
        if (cancelled) return;
        retryLoaderUntil.current = 0;
        setApiUnavailable(false);
        setAlumniList(alumni);
        setMembersList(members);
        setEventsList(events);
        setGalleryList(gallery);
      })
      .catch(async () => {
        const remainingLoaderTime = Math.max(0, retryLoaderUntil.current - Date.now());
        if (remainingLoaderTime) await new Promise(resolve => window.setTimeout(resolve, remainingLoaderTime));
        if (!cancelled) setApiUnavailable(true);
      })
      .finally(() => { if (!cancelled) { retryLoaderUntil.current = 0; setDataLoading(false); } });
    return () => { cancelled = true; };
  }, [reloadDataKey]);

  // Handlers
  const handleAddAlumnus = async (newAlumnus, avatarFile) => {
    const result = await submitRegistration(newAlumnus, avatarFile);
    try { setAlumniList(await getAlumni()); } catch { /* Registration is already saved; keep the existing directory data. */ }
    return result;
  };

  const handleSubmitBistaa = async (newApp, slipFile) => {
    return submitBistaaApplication(newApp, slipFile);
  };

  const handleConfirmRsvp = async (event, attendee) => {
    const pass = await createRsvp(event.id, attendee);
    return pass;
  };

  const refreshCoreData = async () => {
    clearPublicDataCache();
    const { alumni, members, events, gallery } = await getPublicBootstrap();
    setAlumniList(alumni);
    setMembersList(members);
    setEventsList(events);
    setGalleryList(gallery);
  };
  const retryDataLoad = () => {
    clearPublicDataCache();
    retryLoaderUntil.current = Date.now() + 1600;
    setDataLoading(true);
    setReloadDataKey(key => key + 1);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      
      {/* 1. Header & Navigation */}
      {currentView !== 'admin' && <Navbar currentView={currentView} setView={setCurrentView} />}

      {/* 2. Main Page View Content */}
      <main style={{ flex: 1 }}>
        <Suspense fallback={<div className="app-loading-state" role="status">Loading this page…</div>}>
        {currentView === 'home' && (
          <HomePage
            alumniList={alumniList}
            membersList={membersList}
            eventsList={eventsList}
            dataLoadFailed={apiUnavailable}
            dataLoading={dataLoading}
            onRetryData={retryDataLoad}
            setView={setCurrentView}
            onRsvpClick={(ev) => setRsvpEventData(ev)}
          />
        )}

        {currentView === 'directory' && (
          <DirectoryPage
            alumniList={alumniList}
            dataLoadFailed={apiUnavailable}
            dataLoading={dataLoading}
            onRetryData={retryDataLoad}
          />
        )}

        {currentView === 'bistaa' && (
          <BistaaPage
            alumniList={alumniList}
            dataLoadFailed={apiUnavailable}
            dataLoading={dataLoading}
            onRetryData={retryDataLoad}
            onSubmitBistaa={handleSubmitBistaa}
            setView={setCurrentView}
            showToast={showToast}
          />
        )}

        {currentView === 'register' && (
          <RegisterPage
            onAddAlumnus={handleAddAlumnus}
            setView={setCurrentView}
            showToast={showToast}
          />
        )}

        {currentView === 'status' && (
          <StatusPage
            onOpenSlip={(data) => setSlipPreviewData(data)}
            onOpenDigitalPass={(app) => setDigitalPassData(app)}
            setView={setCurrentView}
          />
        )}

        {currentView === 'active-members' && (
          <ActiveMembersPage
            alumniList={membersList}
            dataLoadFailed={apiUnavailable}
            dataLoading={dataLoading}
            onRetryData={retryDataLoad}
            onOpenDigitalPass={(app) => setDigitalPassData(app)}
          />
        )}

        {currentView === 'events' && (
          <EventsPage
            eventsList={eventsList}
            dataLoadFailed={apiUnavailable}
            dataLoading={dataLoading}
            onRetryData={retryDataLoad}
            onRsvpClick={(ev) => setRsvpEventData(ev)}
            setView={setCurrentView}
          />
        )}

        {currentView === 'gallery' && (
          <GalleryPage
            galleryList={galleryList}
            dataLoadFailed={apiUnavailable}
            dataLoading={dataLoading}
            onRetryData={retryDataLoad}
          />
        )}

        {currentView === 'admin' && (
          apiUnavailable ? (
            <section className="admin-database-unavailable" role="alert">
              <div className="admin-db-error-icon">!</div>
              <p className="admin-kicker">ADMIN CONSOLE</p>
              <h1>Admin services temporarily unavailable</h1>
              <p>{dataLoading ? 'Reconnecting to alumni services…' : 'We couldn’t load the alumni records right now. Please try again in a moment.'}</p>
              <button className="admin-primary-btn" onClick={retryDataLoad} disabled={dataLoading} aria-busy={dataLoading}>
                {dataLoading && <span className="admin-retry-spinner" aria-hidden="true" />}
                {dataLoading ? 'Retrying…' : 'Try again'}
              </button>
              <p className="admin-db-support">Need help? Contact the <b>DevLinkHub Team</b> at <a href="mailto:hello.devlinkhub@gmail.com">hello.devlinkhub@gmail.com</a>.</p>
            </section>
          ) : dataLoading ? (
            <section className="admin-database-unavailable" role="status"><div className="admin-db-loading-dot" /><p className="admin-kicker">ADMIN CONSOLE</p><h1>Loading admin workspace</h1><p>Connecting to alumni services…</p></section>
          ) : <AdminPage
            alumniList={alumniList}
            onOpenSlip={async (data) => {
              try {
                setSlipPreviewData({ ...data, slipUrl: await getAdminSlipUrl(data.id) });
              } catch (error) { showToast(error.message, 'error'); }
            }}
            onOpenDigitalPass={(app) => setDigitalPassData(app)}
            showToast={showToast}
            onDataChanged={refreshCoreData}
          />
        )}
        </Suspense>
      </main>

      {/* 3. Footer */}
      {currentView !== 'admin' && <Footer setView={setCurrentView} />}

      {/* 4. Modals */}
      {slipPreviewData && (
        <SlipPreviewModal
          slipData={slipPreviewData}
          onClose={() => setSlipPreviewData(null)}
        />
      )}

      {digitalPassData && (
        <DigitalPassModal
          passData={digitalPassData}
          onClose={() => setDigitalPassData(null)}
        />
      )}

      {rsvpEventData && (
        <RsvpModal
          event={rsvpEventData}
          onClose={() => setRsvpEventData(null)}
          onConfirm={(attendee) => handleConfirmRsvp(rsvpEventData, attendee)}
        />
      )}

      {/* 5. Toast Stack */}
      <Toast toasts={toasts} />

    </div>
  );
}
