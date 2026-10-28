import React, { useState } from 'react';
import ImageWithPlaceholder from '../components/ImageWithPlaceholder';
import { 
  ShieldCheck, 
  Users, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Download, 
  Eye, 
  Search, 
  Filter, 
  DollarSign,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function AdminPage({ 
  bistaaApps, 
  alumniList, 
  onActivateApplication, 
  onRejectApplication, 
  onOpenSlip, 
  onOpenDigitalPass,
  showToast 
}) {
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Metrics
  const totalAlumni = alumniList.length;
  const activeCount = bistaaApps.filter(a => a.status === 'ACTIVE').length;
  const pendingCount = bistaaApps.filter(a => a.status === 'PENDING_VERIFICATION').length;
  const totalRevenue = activeCount * 300;

  // Filtered Apps
  const filtered = bistaaApps.filter(app => {
    if (filterStatus !== 'ALL' && app.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const haystack = `${app.name} ${app.enrollment} ${app.branch} ${app.upi_transaction_id}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  // NAAC / NIRF Accreditation CSV Export
  const exportAccreditationCSV = () => {
    const headers = [
      "Enrollment Number",
      "Full Name",
      "College",
      "Graduation Batch",
      "Degree & Branch",
      "Working Sector",
      "Organization / Employer",
      "Designation",
      "Location Type",
      "City/Country",
      "BISTAA Membership ID"
    ];

    const rows = alumniList.map(a => [
      `"${a.enroll_no}"`,
      `"${a.firstname} ${a.lastname}"`,
      `"${a.college}"`,
      a.batch,
      `"${a.course}"`,
      `"${a.companysector}"`,
      `"${a.connected_to}"`,
      `"${a.pos}"`,
      `"${a.comploc}"`,
      `"${a.companyloc}"`,
      `"${a.bistaa_id || 'Not Registered'}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `BGI_Alumni_NAAC_NIRF_Report_${new Date().getFullYear()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("NAAC/NIRF Accreditation Report downloaded successfully!", "success");
  };

  const handleActivate = (appId) => {
    onActivateApplication(appId);
    try {
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
    } catch (e) {}
  };

  const handleRejectPrompt = (appId, name) => {
    const reason = window.prompt(`Enter rejection reason for ${name}:`, 'UPI UTR does not reconcile with bank ledger or screenshot unreadable.');
    if (reason) {
      onRejectApplication(appId, reason);
    }
  };

  return (
    <div style={{ minHeight: '80vh' }}>
      
      {/* Premium Hero Band */}
      <div className="page-hero-band">
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
            <div>
              <div className="page-hero-eyebrow">
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>admin_panel_settings</span>
                Institutional Administration &amp; Governance
              </div>
              <h1 className="page-hero-title" style={{ marginBottom: '0.5rem' }}>
                BISTAA Verification &amp; Audit Console
              </h1>
              <p className="page-hero-desc">
                Review incoming ₹300 UPI membership applications, reconcile bank UTR transaction slips, 
                and issue official digital credentials adhering to AICTE and NAAC standards.
              </p>
            </div>

            <div>
              <button className="btn-primary-gold" onClick={exportAccreditationCSV}>
                <FileSpreadsheet size={16} /> Export NAAC / NIRF Data (CSV)
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="page-content-section">
        <div className="container">

        {/* 4 Metrics Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2.5rem'
        }}>
          <div className="alumnus-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>TOTAL ALUMNI DATABASE</span>
              <Users size={20} style={{ color: 'var(--bgi-navy-600)' }} />
            </div>
            <h3 style={{ fontSize: '2rem', color: 'var(--bgi-navy-900)' }}>{totalAlumni}</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--bgi-emerald)', fontWeight: 600 }}>Active Graduate Records</p>
          </div>

          <div className="alumnus-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>PENDING VERIFICATIONS</span>
              <Clock size={20} style={{ color: 'var(--bgi-gold)' }} />
            </div>
            <h3 style={{ fontSize: '2rem', color: '#b45309' }}>{pendingCount}</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Awaiting Slip Check</p>
          </div>

          <div className="alumnus-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>ACTIVE BISTAA MEMBERS</span>
              <ShieldCheck size={20} style={{ color: 'var(--bgi-emerald)' }} />
            </div>
            <h3 style={{ fontSize: '2rem', color: 'var(--bgi-emerald)' }}>{activeCount}</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Issued Lifetime Passes</p>
          </div>

          <div className="alumnus-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>FEES COLLECTED (₹)</span>
              <TrendingUp size={20} style={{ color: 'var(--bgi-blue-accent)' }} />
            </div>
            <h3 style={{ fontSize: '2rem', color: 'var(--bgi-navy-850)' }}>₹{totalRevenue}</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>BISTAA Endowment Fund</p>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="directory-controls-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {[
                { id: 'ALL', label: `All Applications (${bistaaApps.length})` },
                { id: 'PENDING_VERIFICATION', label: `Pending Review (${pendingCount})` },
                { id: 'ACTIVE', label: `Active (${activeCount})` },
                { id: 'REJECTED', label: 'Rejected' },
              ].map(tab => (
                <button
                  key={tab.id}
                  className={`country-chip-btn ${filterStatus === tab.id ? 'active' : ''}`}
                  onClick={() => setFilterStatus(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="search-input-wrapper" style={{ minWidth: 260 }}>
              <Search size={16} />
              <input
                type="text"
                className="search-field"
                placeholder="Search applicant or UTR..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ padding: '0.55rem 0.85rem 0.55rem 2.5rem', fontSize: '0.85rem' }}
              />
            </div>
          </div>
        </div>

        {/* Verification Queue Table */}
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Applicant Full Name</th>
                <th>Enrollment Number</th>
                <th>Branch &amp; College</th>
                <th>12-Digit UPI UTR</th>
                <th>Payment Slip</th>
                <th>Status</th>
                <th>Verification Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(app => (
                <tr key={app.id}>
                  <td>
                    <b>{app.name}</b>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                      Submitted: {app.submitted_at}
                    </div>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--bgi-navy-850)' }}>
                    {app.enrollment}
                  </td>
                  <td>
                    {app.branch} ({app.college})
                  </td>
                  <td>
                    <code style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--bgi-navy-600)' }}>
                      {app.upi_transaction_id}
                    </code>
                  </td>
                  <td>
                    <div 
                      className="slip-thumb-btn"
                      onClick={() => onOpenSlip({
                        slipUrl: app.transaction_slip,
                        name: app.name,
                        enrollment: app.enrollment,
                        branch: app.branch,
                        college: app.college,
                        utr: app.upi_transaction_id,
                        status: app.status,
                        appId: app.id
                      })}
                      title="Click to zoom slip screenshot"
                    >
                      <ImageWithPlaceholder
                        src={app.transaction_slip}
                        alt="Payment slip preview"
                        className="slip-thumb-image"
                        placeholderLabel="Slip not uploaded"
                      />
                    </div>
                  </td>
                  <td>
                    {app.status === 'ACTIVE' && (
                      <span className="pill pill-emerald" style={{ fontSize: '0.7rem' }}>
                        <CheckCircle2 size={12} /> ACTIVE
                      </span>
                    )}
                    {app.status === 'PENDING_VERIFICATION' && (
                      <span className="pill pill-gold" style={{ fontSize: '0.7rem' }}>
                        <Clock size={12} /> PENDING
                      </span>
                    )}
                    {app.status === 'REJECTED' && (
                      <span className="pill pill-navy" style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', fontSize: '0.7rem' }}>
                        <XCircle size={12} /> REJECTED
                      </span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      {app.status === 'PENDING_VERIFICATION' && (
                        <>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleActivate(app.id)}
                            title="Approve ₹300 payment & generate membership ID"
                          >
                            <CheckCircle2 size={14} /> Activate Member
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ color: 'var(--bgi-crimson)', borderColor: '#fecaca' }}
                            onClick={() => handleRejectPrompt(app.id, app.name)}
                            title="Reject payment slip"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {app.status === 'ACTIVE' && (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => onOpenDigitalPass(app)}
                          title="View Digital BISTAA Identity Pass"
                        >
                          <Eye size={14} /> View ID Pass
                        </button>
                      )}

                      {app.status === 'REJECTED' && (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleActivate(app.id)}
                          title="Re-open and activate"
                        >
                          Re-Approve
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        </div>
      </div>
    </div>
  );
}
