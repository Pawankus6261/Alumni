import React, { useState, useMemo } from 'react';
import ImageWithPlaceholder from '../components/ImageWithPlaceholder';
import { 
  Search, 
  Building, 
  MapPin, 
  GraduationCap, 
  Briefcase, 
  Filter, 
  Globe, 
  ShieldCheck, 
  LayoutGrid, 
  List, 
  RotateCcw,
  Landmark,
  Zap,
  Building2,
  Lightbulb,
  ExternalLink
} from 'lucide-react';

export default function DirectoryPage({ alumniList }) {
  const [activeSector, setActiveSector] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollege, setSelectedCollege] = useState('ALL');
  const [selectedBatch, setSelectedBatch] = useState('ALL');
  const [selectedBranch, setSelectedBranch] = useState('ALL');
  const [selectedLocation, setSelectedLocation] = useState('ALL');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  const sectors = [
    { id: 'All', label: 'All Sectors', icon: LayoutGrid },
    { id: 'Government', label: 'Government Sector', icon: Landmark },
    { id: 'Semi-Government', label: 'Semi-Govt / PSU', icon: Zap },
    { id: 'Private', label: 'Private Sector', icon: Building2 },
    { id: 'Self Employed', label: 'Entrepreneurs & Startups', icon: Lightbulb },
  ];

  // Filter computation
  const filteredAlumni = useMemo(() => {
    return alumniList.filter(a => {
      // Sector filter
      if (activeSector !== 'All' && a.companysector !== activeSector) {
        return false;
      }
      // College filter
      if (selectedCollege !== 'ALL' && a.college !== selectedCollege) {
        return false;
      }
      // Batch filter
      if (selectedBatch !== 'ALL' && String(a.batch) !== selectedBatch) {
        return false;
      }
      // Branch filter
      if (selectedBranch !== 'ALL' && !a.course.toLowerCase().includes(selectedBranch.toLowerCase())) {
        return false;
      }
      // Location filter (India vs Abroad)
      if (selectedLocation !== 'ALL' && a.comploc !== selectedLocation) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const haystack = `
          ${a.firstname} ${a.lastname} ${a.connected_to} ${a.pos} 
          ${a.course} ${a.college} ${a.companyloc} ${a.enroll_no} ${(a.skills || []).join(' ')}
        `.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [alumniList, activeSector, selectedCollege, selectedBatch, selectedBranch, selectedLocation, searchQuery]);

  const resetFilters = () => {
    setActiveSector('All');
    setSearchQuery('');
    setSelectedCollege('ALL');
    setSelectedBatch('ALL');
    setSelectedBranch('ALL');
    setSelectedLocation('ALL');
  };

  return (
    <div style={{ minHeight: '80vh' }}>

      {/* Premium Page Header Band */}
      <div className="directory-hero-band">
        <div className="container">
          <div className="page-hero-eyebrow">
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>group</span>
            Centralized Directory
          </div>
          <h1 className="page-hero-title">Alumni Directory &amp; Industry Network</h1>
          <p className="page-hero-desc">
            Discover and connect with thousands of verified Bansal graduates categorized by
            professional sector, constituent college, and graduation batch.
          </p>

          {/* Search bar in hero */}
          <div className="directory-search-bar">
            <Search size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search by name, organization, department, skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="page-content-section">
        <div className="container">

          {/* Sector Tabs */}
          <div className="sector-tabs">
            {sectors.map(s => {
              const Icon = s.icon;
              return (
                <button
                  key={s.id}
                  className={`sector-tab ${activeSector === s.id ? 'active' : ''}`}
                  onClick={() => setActiveSector(s.id)}
                >
                  <Icon size={15} />
                  {s.label}
                </button>
              );
            })}
          </div>

          {/* Directory Controls Card */}
          <div className="directory-controls-card" style={{ marginBottom: '2.5rem' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1.25rem',
              alignItems: 'center'
            }}>
              {/* College Filter */}
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--navy-700)', marginBottom: '0.45rem' }}>
                  Institution / College
                </label>
                <select
                  className="filter-select"
                  style={{ width: '100%' }}
                  value={selectedCollege}
                  onChange={(e) => setSelectedCollege(e.target.value)}
                >
                  <option value="ALL">All Colleges (BIST, BIRT, BIRTS)</option>
                  <option value="BIST">BIST (Science &amp; Tech)</option>
                  <option value="BIRT">BIRT (Research &amp; Tech)</option>
                  <option value="BIRTS">BIRTS (Research, Tech &amp; Science)</option>
                </select>
              </div>

              {/* Batch Filter */}
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--navy-700)', marginBottom: '0.45rem' }}>
                  Graduation Batch
                </label>
                <select
                  className="filter-select"
                  style={{ width: '100%' }}
                  value={selectedBatch}
                  onChange={(e) => setSelectedBatch(e.target.value)}
                >
                  <option value="ALL">All Batches (2005 - 2024)</option>
                  {[2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011, 2010, 2009, 2008, 2007].map(b => (
                    <option key={b} value={b}>Batch of {b}</option>
                  ))}
                </select>
              </div>

              {/* Branch Filter */}
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--navy-700)', marginBottom: '0.45rem' }}>
                  Branch / Degree
                </label>
                <select
                  className="filter-select"
                  style={{ width: '100%' }}
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                >
                  <option value="ALL">All Branches &amp; Degrees</option>
                  <option value="Computer Science">Computer Science (CSE)</option>
                  <option value="Information Technology">Information Technology (IT)</option>
                  <option value="Electronic & Communication">Electronic &amp; Comm (ECE)</option>
                  <option value="Electrical">Electrical Engg. (EE)</option>
                  <option value="Mechanical">Mechanical Engg. (ME)</option>
                  <option value="Civil">Civil Engg (CE)</option>
                  <option value="Business Administration">MBA (Management)</option>
                  <option value="Computer Applications">MCA (Applications)</option>
                </select>
              </div>
            </div>

            {/* Sub-bar: Results count, Location filter, View Mode, Reset */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
              marginTop: '1.25rem',
              paddingTop: '1.25rem',
              borderTop: '1px solid var(--border-light)',
              fontSize: '0.85rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, color: 'var(--navy-800)' }}>
                  {filteredAlumni.length} {filteredAlumni.length === 1 ? 'Alumnus' : 'Alumni'} Found
                </span>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <button
                    className={`tag-chip ${selectedLocation === 'ALL' ? 'tag-batch' : 'tag-sector'}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedLocation('ALL')}
                  >
                    All Locations
                  </button>
                  <button
                    className={`tag-chip ${selectedLocation === 'INDIA' ? 'tag-batch' : 'tag-sector'}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedLocation('INDIA')}
                  >
                    🇮🇳 In India
                  </button>
                  <button
                    className={`tag-chip ${selectedLocation === 'ABROAD' ? 'tag-batch' : 'tag-sector'}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedLocation('ABROAD')}
                  >
                    🌐 Global Placements
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {(searchQuery || selectedCollege !== 'ALL' || selectedBatch !== 'ALL' || selectedBranch !== 'ALL' || selectedLocation !== 'ALL' || activeSector !== 'All') && (
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={resetFilters}
                    style={{ color: '#dc2626' }}
                  >
                    <RotateCcw size={13} /> Reset Filters
                  </button>
                )}

                <div style={{ display: 'flex', border: '1px solid var(--border-light)', borderRadius: 'var(--r-sm)', overflow: 'hidden' }}>
                  <button
                    onClick={() => setViewMode('grid')}
                    style={{
                      padding: '0.45rem 0.75rem',
                      background: viewMode === 'grid' ? 'var(--navy-800)' : '#fff',
                      color: viewMode === 'grid' ? '#fff' : '#64748b'
                    }}
                    title="Grid Cards View"
                  >
                    <LayoutGrid size={16} />
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    style={{
                      padding: '0.45rem 0.75rem',
                      background: viewMode === 'table' ? 'var(--navy-800)' : '#fff',
                      color: viewMode === 'table' ? '#fff' : '#64748b'
                    }}
                    title="Compact Table View"
                  >
                    <List size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>

        {/* Empty State */}
        {filteredAlumni.length === 0 && (
          <div style={{
            background: '#ffffff',
            border: '1px solid var(--border-card)',
            borderRadius: 'var(--radius-xl)',
            padding: '4rem 2rem',
            textAlign: 'center',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: '#f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
              color: 'var(--text-muted)'
            }}>
              <Search size={32} />
            </div>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--bgi-navy-900)', marginBottom: '0.5rem' }}>
              No Alumni Matching Your Filter Criteria
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: 460, margin: '0 auto 1.5rem' }}>
              Try adjusting your search keyword, choosing a different sector or passout batch year, or reset your filters.
            </p>
            <button className="btn btn-secondary btn-sm" onClick={resetFilters}>
              <RotateCcw size={14} /> Clear All Filters
            </button>
          </div>
        )}

        {/* View Mode 1: Grid Cards */}
        {viewMode === 'grid' && filteredAlumni.length > 0 && (
          <div className="alumni-grid">
            {filteredAlumni.map(alumnus => (
              <div key={alumnus.id} className="alumnus-card">
                <div>
                  <div className="alumnus-card-header">
                    <div className="alumnus-avatar-box">
                      <ImageWithPlaceholder
                        src={alumnus.img_url}
                        alt={`${alumnus.firstname} ${alumnus.lastname}`}
                        variant="avatar"
                        className="alumnus-avatar"
                        style={{ background: alumnus.avatar_color || 'var(--bgi-navy-850)' }}
                        placeholderLabel={`${alumnus.firstname[0]}${alumnus.lastname[0]}`}
                      />
                      <div className="flag-badge" title={alumnus.country_name || 'India'}>
                        {alumnus.country_flag || '🇮🇳'}
                      </div>
                    </div>
                    <div className="alumnus-header-info">
                      <h4>{alumnus.firstname} {alumnus.lastname}</h4>
                      <div className="alumnus-company-text">
                        <Building size={14} /> {alumnus.connected_to}
                      </div>
                    </div>
                  </div>

                  <div className="alumnus-card-body">
                    <div className="meta-details-list">
                      <div className="meta-detail-row">
                        <Briefcase size={15} />
                        <span><b>Role:</b> {alumnus.pos}</span>
                      </div>
                      <div className="meta-detail-row">
                        <MapPin size={15} />
                        <span><b>Location:</b> {alumnus.companyloc}</span>
                      </div>
                      <div className="meta-detail-row">
                        <GraduationCap size={15} />
                        <span><b>Program:</b> {alumnus.college} • {alumnus.course}</span>
                      </div>
                    </div>

                    <div className="alumni-tags-row">
                      <span className="tag-chip tag-batch">Class of {alumnus.batch}</span>
                      <span className="tag-chip tag-sector">{alumnus.companysector}</span>
                      {alumnus.is_bistaa_member && (
                        <span className="tag-chip tag-active-bistaa">
                          <ShieldCheck size={12} /> Verified Member
                        </span>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

        {/* View Mode 2: Compact Table */}
        {viewMode === 'table' && filteredAlumni.length > 0 && (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Alumnus Name</th>
                  <th>Company / Employer</th>
                  <th>Designation</th>
                  <th>College &amp; Branch</th>
                  <th>Batch</th>
                  <th>Sector</th>
                  <th>Location</th>
                </tr>
              </thead>
              <tbody>
                {filteredAlumni.map(a => (
                  <tr key={a.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div style={{
                          width: 34,
                          height: 34,
                          borderRadius: '50%',
                          background: a.avatar_color || 'var(--bgi-navy-850)',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          flexShrink: 0
                        }}>
                          {a.firstname[0]}{a.lastname[0]}
                        </div>
                        <div>
                          <b>{a.firstname} {a.lastname}</b>
                          {a.is_bistaa_member && (
                            <span style={{ color: 'var(--bgi-emerald)', marginLeft: 4 }} title="Verified BISTAA Member">
                              <ShieldCheck size={14} style={{ display: 'inline' }} />
                            </span>
                          )}
                          <div style={{ fontSize: '0.725rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                            {a.enroll_no}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--bgi-blue-accent)' }}>{a.connected_to}</td>
                    <td>{a.pos}</td>
                    <td>{a.college} - {a.course}</td>
                    <td>Class of {a.batch}</td>
                    <td><span className="tag-chip tag-sector">{a.companysector}</span></td>
                    <td>{a.country_flag || '📍'} {a.companyloc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  </div>
);
}

