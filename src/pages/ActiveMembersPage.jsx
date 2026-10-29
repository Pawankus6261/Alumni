import React, { useEffect, useState } from 'react';
import ImageWithPlaceholder from '../components/ImageWithPlaceholder';
import DataLoadNotice from '../components/DataLoadNotice';
import Pagination from '../components/Pagination';
import { 
  Award, 
  ShieldCheck, 
  Building, 
  GraduationCap, 
  MapPin, 
  IdCard, 
  Search,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

export default function ActiveMembersPage({ alumniList, onOpenDigitalPass, dataLoadFailed, dataLoading, onRetryData }) {
  const [search, setSearch] = useState('');
  const [collegeFilter, setCollegeFilter] = useState('ALL');
  const [batchFilter, setBatchFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const memberDetailsScore = member => [
    ['connected_to', 4], ['pos', 3], ['companyloc', 2], ['batch', 1],
    ['course', 1], ['companysector', 1], ['img_url', 1],
  ].reduce((score, [key, weight]) => score + (String(member[key] ?? '').trim() ? weight : 0), 0);
  const activeMembers = alumniList.filter(a => a.is_bistaa_member).slice().sort((a, b) =>
    memberDetailsScore(b) - memberDetailsScore(a) ||
    String(a.connected_to || '').localeCompare(String(b.connected_to || '')) ||
    `${a.firstname || ''} ${a.lastname || ''}`.localeCompare(`${b.firstname || ''} ${b.lastname || ''}`),
  );
  const batchOptions = [...new Set(activeMembers.map(member => Number(member.batch)).filter(batch => Number.isInteger(batch) && batch >= 1980 && batch <= new Date().getFullYear()))].sort((a, b) => b - a);

  const filtered = activeMembers.filter(a => {
            if (collegeFilter !== 'ALL' && a.college !== collegeFilter) return false;
            if (batchFilter !== 'ALL' && String(a.batch ?? '') !== batchFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      const haystack = `${a.firstname} ${a.lastname} ${a.connected_to} ${a.pos} ${a.course} ${a.bistaa_id}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const memberEmployer = alumnus => [alumnus.connected_to, alumnus.pos ? `(${alumnus.pos})` : ''].filter(Boolean).join(' ');

  useEffect(() => setPage(1), [search, collegeFilter, batchFilter]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageMembers = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div style={{ minHeight: '80vh' }}>
      
      {/* Premium Hero Band */}
      <div className="page-hero-band">
        <div className="container">
          <div className="page-hero-eyebrow">
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>shield</span>
            Verified Institutional Lifetime Roll
          </div>
          <h1 className="page-hero-title">BISTAA Active Lifetime Members</h1>
          <p className="page-hero-desc">
            Honoring verified lifetime members of the Bansal Institute of Science &amp; Technology 
            Alumni Association. Recognizing verified members and their continued connection to BIST.
          </p>
        </div>
      </div>

      <div className="page-content-section">
        <div className="container">

        {/* Filter Controls */}
          <div className="directory-controls-card active-members-controls">
          <div className="active-members-filter-grid">
            <label className="search-input-wrapper" aria-label="Search BISTAA members">
              <Search size={18} aria-hidden="true" />
              <input
                type="text"
                className="search-field"
                placeholder="Search by name, company, location, or member ID"
                aria-label="Search active members"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>

            <label className="active-members-select-wrap">
              <span>College</span>
              <select
                aria-label="Filter by college"
                className="select-field" 
                value={collegeFilter}
                onChange={(e) => setCollegeFilter(e.target.value)}
              >
                <option value="ALL">All Colleges</option>
                <option value="BIST">BIST (Science &amp; Tech)</option>
                <option value="BIRT">BIRT (Research &amp; Tech)</option>
                <option value="BIRTS">BIRTS (Research, Tech &amp; Science)</option>
              </select>
            </label>

            <label className="active-members-select-wrap">
              <span>Graduation batch</span>
              <select
                aria-label="Filter by graduation batch"
                className="select-field" 
                value={batchFilter}
                onChange={(e) => setBatchFilter(e.target.value)}
              >
                <option value="ALL">All Batches</option>
                {batchOptions.map(b => (
                  <option key={b} value={b}>Batch of {b}</option>
                ))}
              </select>
            </label>
          </div>

          {!(dataLoadFailed && alumniList.length === 0) && <div className="active-members-result-count" aria-live="polite">
            <span>Verified lifetime members</span>
            <strong>{filtered.length} <span>of {activeMembers.length}</span></strong>
          </div>}
          <Pagination page={currentPage} pageSize={pageSize} total={filtered.length} onPageChange={setPage} label="members" />
        </div>

        {/* Active Members Grid */}
        {dataLoadFailed && alumniList.length === 0 ? <DataLoadNotice label="Verified member list" onRetry={onRetryData} loading={dataLoading} /> : <>
        <div className="alumni-grid active-members-grid">
          {pageMembers.map(alumnus => (
            <div 
              key={alumnus.id} 
              className="alumnus-card active-member-card"
            >
              <div>
                <div 
                  className="alumnus-card-header active-member-card-header"
                >
                  <div className="alumnus-avatar-box">
                    <ImageWithPlaceholder
                      src={alumnus.img_url}
                      alt={`${alumnus.firstname} ${alumnus.lastname}`}
                      variant="avatar"
                      className="alumnus-avatar"
                      style={{ background: '#047857' }}
                      placeholderLabel={`${alumnus.firstname[0]}${alumnus.lastname[0]}`}
                    />
                    <div className="flag-badge" title="Verified Member">🎖️</div>
                  </div>

                  <div className="alumnus-header-info">
                    <h4>{alumnus.firstname} {alumnus.lastname}</h4>
                    <span className="pill pill-emerald active-member-id">
                      <CheckCircle2 size={11} /> {alumnus.bistaa_id || 'Active Member'}
                    </span>
                  </div>
                </div>

                <div className="alumnus-card-body active-member-card-body">
                  <div className="meta-details-list">
                    {memberEmployer(alumnus) && <div className="meta-detail-row">
                      <Building size={15} />
                      <span>{alumnus.connected_to && <b>{alumnus.connected_to}</b>}{alumnus.connected_to && alumnus.pos ? ' ' : ''}{alumnus.pos && <span>({alumnus.pos})</span>}</span>
                    </div>}
                    <div className="meta-detail-row">
                      <GraduationCap size={15} />
                      <span>{alumnus.college || 'BIST'}{alumnus.course ? ` • ${alumnus.course}` : ''} (Batch {alumnus.batch || '—'})</span>
                    </div>
                    {alumnus.companyloc && <div className="meta-detail-row">
                      <MapPin size={15} />
                      <span>{alumnus.companyloc}</span>
                    </div>}
                    {!memberEmployer(alumnus) && !alumnus.companyloc && <div className="active-member-profile-missing">Professional details not provided in the linked alumni profile.</div>}
                  </div>

                  <div className="alumni-tags-row">
                    <span className="tag-chip tag-batch">{alumnus.batch ? `Batch of ${alumnus.batch}` : 'Batch unavailable'}</span>
                    {alumnus.companysector && <span className="tag-chip tag-sector">{alumnus.companysector}</span>}
                    <span className="tag-chip tag-active-bistaa">
                      <ShieldCheck size={12} /> BISTAA Lifetime Pass
                    </span>
                  </div>
                </div>
              </div>

              <div className="active-member-card-footer">
                <button 
                  className="btn btn-secondary btn-sm active-member-pass-button"
                  onClick={() => onOpenDigitalPass({
                    name: `${alumnus.firstname} ${alumnus.lastname}`,
                    enrollment: alumnus.enroll_no,
                    college: alumnus.college,
                    branch: alumnus.course,
                    membership_id: alumnus.bistaa_id,
                    img_url: alumnus.img_url
                  })}
                >
                  <IdCard size={15} /> View Official Digital Pass
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="active-members-empty">
              <Search size={22} aria-hidden="true" />
              <strong>No members match those filters</strong>
              <span>Try a different name, college, or graduation batch.</span>
              <button type="button" onClick={() => { setSearch(''); setCollegeFilter('ALL'); setBatchFilter('ALL'); }}>
                Clear filters
              </button>
            </div>
          )}
        </div>
        {filtered.length > pageSize && <Pagination page={currentPage} pageSize={pageSize} total={filtered.length} onPageChange={setPage} label="members" />}
        </>}

        </div>
      </div>
    </div>
  );
}
