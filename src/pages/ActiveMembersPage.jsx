import React, { useState } from 'react';
import ImageWithPlaceholder from '../components/ImageWithPlaceholder';
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

export default function ActiveMembersPage({ alumniList, onOpenDigitalPass }) {
  const [search, setSearch] = useState('');
  const [collegeFilter, setCollegeFilter] = useState('ALL');
  const [batchFilter, setBatchFilter] = useState('ALL');

  const activeMembers = alumniList.filter(a => a.is_bistaa_member);

  const filtered = activeMembers.filter(a => {
    if (collegeFilter !== 'ALL' && a.college !== collegeFilter) return false;
    if (batchFilter !== 'ALL' && String(a.batch) !== batchFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      const haystack = `${a.firstname} ${a.lastname} ${a.connected_to} ${a.pos} ${a.course} ${a.bistaa_id}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

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
                {[2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011, 2010, 2009, 2008, 2007].map(b => (
                  <option key={b} value={b}>Batch of {b}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="active-members-result-count" aria-live="polite">
            <span>Verified lifetime members</span>
            <strong>{filtered.length} <span>of {activeMembers.length}</span></strong>
          </div>
        </div>

        {/* Active Members Grid */}
        <div className="alumni-grid active-members-grid">
          {filtered.map(alumnus => (
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
                    <div className="meta-detail-row">
                      <Building size={15} />
                      <span><b>{alumnus.connected_to}</b> ({alumnus.pos})</span>
                    </div>
                    <div className="meta-detail-row">
                      <GraduationCap size={15} />
                      <span>{alumnus.college} • {alumnus.course} (Batch {alumnus.batch})</span>
                    </div>
                    <div className="meta-detail-row">
                      <MapPin size={15} />
                      <span>{alumnus.companyloc}</span>
                    </div>
                  </div>

                  <div className="alumni-tags-row">
                    <span className="tag-chip tag-batch">Class of {alumnus.batch}</span>
                    <span className="tag-chip tag-sector">{alumnus.companysector}</span>
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

        </div>
      </div>
    </div>
  );
}
