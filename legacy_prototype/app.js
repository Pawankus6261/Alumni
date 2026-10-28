/**
 * BGI ALUMENTO - Client-Side Interactive Engine
 * Modernized reproduction of bistalumni.in for Bansal Group of Institutions (BIST)
 */

// 1. Initial Mock Database
const INITIAL_ALUMNI = [
  {
    id: "alum-1",
    enroll_no: "0112CS151042",
    firstname: "Yash",
    lastname: "Agrawal",
    college: "BIST",
    batch: 2015,
    course: "Computer Science Engg.",
    companysector: "Private",
    connected_to: "Amazon",
    pos: "Senior Software Engineer",
    comploc: "ABROAD",
    companyloc: "Seattle, WA, USA",
    country_flag: "🇺🇸",
    img_url: "assets/yash.jpg",
    email: "yash.agrawal@amazon.com",
    phone_no: "9826012345",
    linkedinid: "https://linkedin.com/in/yashagrawal",
    is_abroad: true,
    is_elite: true,
    is_bistaa_member: true,
    bistaa_id: "BISTAA-2015-0104"
  },
  {
    id: "alum-2",
    enroll_no: "0112EE101018",
    firstname: "Shivam",
    lastname: "Gupta",
    college: "BIST",
    batch: 2010,
    course: "Electrical Engg.",
    companysector: "Private",
    connected_to: "Walmart Global Tech",
    pos: "Principal Systems Architect",
    comploc: "ABROAD",
    companyloc: "Sunnyvale, CA, USA",
    country_flag: "🇺🇸",
    img_url: null,
    avatar_color: "#1e3a8a",
    email: "shivam.g@walmart.com",
    phone_no: "9826023456",
    linkedinid: "https://linkedin.com/in/shivamgupta",
    is_abroad: true,
    is_elite: false,
    is_bistaa_member: true,
    bistaa_id: "BISTAA-2010-0089"
  },
  {
    id: "alum-3",
    enroll_no: "0112EC071029",
    firstname: "Nitin",
    lastname: "Gupta",
    college: "BIST",
    batch: 2007,
    course: "Electronic & Communication",
    companysector: "Private",
    connected_to: "Vodafone UK",
    pos: "Telecom Networks Lead",
    comploc: "ABROAD",
    companyloc: "London, United Kingdom",
    country_flag: "🇬🇧",
    img_url: null,
    avatar_color: "#b91c1c",
    email: "nitin.gupta@vodafone.co.uk",
    phone_no: "9826034567",
    linkedinid: "https://linkedin.com/in/nitingupta",
    is_abroad: true,
    is_elite: true,
    is_bistaa_member: true,
    bistaa_id: "BISTAA-2007-0034"
  },
  {
    id: "alum-4",
    enroll_no: "0112CS231088",
    firstname: "Mo Ahsan",
    lastname: "Ahmad",
    college: "BIST",
    batch: 2023,
    course: "Computer Science Engg.",
    companysector: "Private",
    connected_to: "Brock University",
    pos: "Graduate Researcher & MS Scholar",
    comploc: "ABROAD",
    companyloc: "Ontario, Canada",
    country_flag: "🇨🇦",
    img_url: null,
    avatar_color: "#047857",
    email: "ahsan.ahmad@brocku.ca",
    phone_no: "9826045678",
    linkedinid: "https://linkedin.com/in/ahsanahmad",
    is_abroad: true,
    is_elite: false,
    is_bistaa_member: true,
    bistaa_id: "BISTAA-2023-0412"
  },
  {
    id: "alum-5",
    enroll_no: "0112CS081014",
    firstname: "Ankit",
    lastname: "Garg",
    college: "BIST",
    batch: 2008,
    course: "Computer Science Engg.",
    companysector: "Private",
    connected_to: "ServiceNow",
    pos: "Staff Software Engineer",
    comploc: "ABROAD",
    companyloc: "San Diego, CA, USA",
    country_flag: "🇺🇸",
    img_url: null,
    avatar_color: "#4338ca",
    email: "ankit.garg@servicenow.com",
    phone_no: "9826056789",
    linkedinid: "https://linkedin.com/in/ankitgarg",
    is_abroad: true,
    is_elite: false,
    is_bistaa_member: true,
    bistaa_id: "BISTAA-2008-0051"
  },
  {
    id: "alum-6",
    enroll_no: "0112CS091002",
    firstname: "Saurabh",
    lastname: "Gupta",
    college: "BIST",
    batch: 2009,
    course: "Computer Science Engg.",
    companysector: "Private",
    connected_to: "TATA Projects",
    pos: "Manager SCM",
    comploc: "INDIA",
    companyloc: "Mumbai, Maharashtra",
    country_flag: "🇮🇳",
    img_url: null,
    avatar_color: "#0f766e",
    email: "saurabh.gupta@tataprojects.com",
    phone_no: "9826067890",
    linkedinid: "https://linkedin.com/in/saurabhgupta",
    is_abroad: false,
    is_elite: true,
    is_bistaa_member: true,
    bistaa_id: "BISTAA-2009-0019"
  },
  {
    id: "alum-7",
    enroll_no: "0112ME181055",
    firstname: "Alok",
    lastname: "Kumar",
    college: "BIST",
    batch: 2018,
    course: "Mechanical Engg.",
    companysector: "Private",
    connected_to: "L&T Defense",
    pos: "Quality Engineer",
    comploc: "INDIA",
    companyloc: "Vadodara, Gujarat",
    country_flag: "🇮🇳",
    img_url: null,
    avatar_color: "#b45309",
    email: "alok.kumar@larsentoubro.com",
    phone_no: "9826078901",
    linkedinid: "https://linkedin.com/in/alokkumar",
    is_abroad: false,
    is_elite: true,
    is_bistaa_member: true,
    bistaa_id: "BISTAA-2018-0240"
  },
  {
    id: "alum-8",
    enroll_no: "0112IT121033",
    firstname: "Shefali",
    lastname: "Varshney",
    college: "BIST",
    batch: 2012,
    course: "Information Technology",
    companysector: "Private",
    connected_to: "Google",
    pos: "Technical Program Manager",
    comploc: "INDIA",
    companyloc: "Bengaluru, Karnataka",
    country_flag: "🇮🇳",
    img_url: null,
    avatar_color: "#be185d",
    email: "shefali.v@google.com",
    phone_no: "9826089012",
    linkedinid: "https://linkedin.com/in/shefalivarshney",
    is_abroad: false,
    is_elite: true,
    is_bistaa_member: true,
    bistaa_id: "BISTAA-2012-0112"
  },
  {
    id: "alum-9",
    enroll_no: "0112EC171011",
    firstname: "Priya",
    lastname: "Verma",
    college: "BIST",
    batch: 2017,
    course: "Electronic & Communication",
    companysector: "Government",
    connected_to: "ISRO - Indian Space Research Organisation",
    pos: "Scientist / Engineer 'SC'",
    comploc: "INDIA",
    companyloc: "ISRO Telemetry Centre, Bengaluru",
    country_flag: "🇮🇳",
    img_url: null,
    avatar_color: "#1d4ed8",
    email: "priya.verma@isro.gov.in",
    phone_no: "9826090123",
    linkedinid: "https://linkedin.com/in/priyaverma",
    is_abroad: false,
    is_elite: true,
    is_bistaa_member: true,
    bistaa_id: "BISTAA-2017-0091"
  },
  {
    id: "alum-10",
    enroll_no: "0112EE161040",
    firstname: "Deepanshu",
    lastname: "Tiwari",
    college: "BIST",
    batch: 2016,
    course: "Electrical Engg.",
    companysector: "Government",
    connected_to: "MP Power Transmission Co. Ltd (MPPTCL)",
    pos: "Assistant Engineer (Class-1 Officer)",
    comploc: "INDIA",
    companyloc: "Bhopal, Madhya Pradesh",
    country_flag: "🇮🇳",
    img_url: null,
    avatar_color: "#0369a1",
    email: "d.tiwari@mptransco.in",
    phone_no: "9826101234",
    linkedinid: "https://linkedin.com/in/deepanshutiwari",
    is_abroad: false,
    is_elite: false,
    is_bistaa_member: true,
    bistaa_id: "BISTAA-2016-0155"
  },
  {
    id: "alum-11",
    enroll_no: "0112ME151025",
    firstname: "Ankita",
    lastname: "Dubey",
    college: "BIST",
    batch: 2015,
    course: "Mechanical Engg.",
    companysector: "Semi-Government",
    connected_to: "BHEL Bhopal (Bharat Heavy Electricals Ltd)",
    pos: "Executive Engineer",
    comploc: "INDIA",
    companyloc: "Bhopal, Madhya Pradesh",
    country_flag: "🇮🇳",
    img_url: null,
    avatar_color: "#047857",
    email: "ankita.d@bhel.in",
    phone_no: "9826112345",
    linkedinid: "https://linkedin.com/in/ankitadubey",
    is_abroad: false,
    is_elite: false,
    is_bistaa_member: true,
    bistaa_id: "BISTAA-2015-0211"
  },
  {
    id: "alum-12",
    enroll_no: "0112CS131019",
    firstname: "Gaurav",
    lastname: "Rathore",
    college: "BIST",
    batch: 2013,
    course: "Computer Science Engg.",
    companysector: "Self Employed",
    connected_to: "TechVerve Solutions Pvt Ltd",
    pos: "Founder & Managing Director",
    comploc: "INDIA",
    companyloc: "Indore, Madhya Pradesh",
    country_flag: "🇮🇳",
    img_url: null,
    avatar_color: "#7c3aed",
    email: "gaurav@techverve.io",
    phone_no: "9826123456",
    linkedinid: "https://linkedin.com/in/gauravrathore",
    is_abroad: false,
    is_elite: true,
    is_bistaa_member: true,
    bistaa_id: "BISTAA-2013-0012"
  }
];

// Initial BISTAA Registration Applications (for Status Tracker & Admin Desk)
const INITIAL_BISTAA_APPS = [
  {
    id: "app-101",
    enrollment: "0112CS151042",
    name: "Yash Agrawal",
    branch: "Computer Science Engg.",
    college: "BIST",
    batch: 2015,
    amount: "300",
    upi_transaction_id: "428910394821",
    transaction_slip: "assets/bistaa_qr.jpg",
    status: "ACTIVE", // ACTIVE, PENDING_VERIFICATION, REJECTED
    membership_id: "BISTAA-2015-0104",
    submitted_at: "2026-10-10 14:32:00",
    verified_at: "2026-10-11 10:15:00"
  },
  {
    id: "app-102",
    enrollment: "0112EE101018",
    name: "Shivam Gupta",
    branch: "Electrical Engg.",
    college: "BIST",
    batch: 2010,
    amount: "300",
    upi_transaction_id: "392019485721",
    transaction_slip: "assets/bistaa_qr.jpg",
    status: "ACTIVE",
    membership_id: "BISTAA-2010-0089",
    submitted_at: "2026-10-12 09:20:00",
    verified_at: "2026-10-12 16:45:00"
  },
  {
    id: "app-103",
    enrollment: "0112IT211064",
    name: "Aarav Sharma",
    branch: "Information Technology",
    college: "BIST",
    batch: 2021,
    amount: "300",
    upi_transaction_id: "582910482910",
    transaction_slip: "assets/bistaa_qr.jpg",
    status: "PENDING_VERIFICATION",
    membership_id: null,
    submitted_at: "2026-10-14 17:10:00",
    verified_at: null
  }
];

// Storage Initialization
function getAlumniData() {
  const stored = localStorage.getItem("bgi_alumni_data");
  if (!stored) {
    localStorage.setItem("bgi_alumni_data", JSON.stringify(INITIAL_ALUMNI));
    return INITIAL_ALUMNI;
  }
  return JSON.parse(stored);
}

function getBistaaApplications() {
  const stored = localStorage.getItem("bgi_bistaa_apps");
  if (!stored) {
    localStorage.setItem("bgi_bistaa_apps", JSON.stringify(INITIAL_BISTAA_APPS));
    return INITIAL_BISTAA_APPS;
  }
  return JSON.parse(stored);
}

function saveBistaaApplications(apps) {
  localStorage.setItem("bgi_bistaa_apps", JSON.stringify(apps));
}

function saveAlumniData(alumni) {
  localStorage.setItem("bgi_alumni_data", JSON.stringify(alumni));
}

// 2. Navigation & View Routing
let currentActiveSector = "All";

function showView(viewName) {
  // Hide all tab views
  document.querySelectorAll(".tab-view").forEach(el => el.classList.remove("active"));
  document.querySelectorAll(".nav-link").forEach(el => el.classList.remove("active"));

  // Show target view
  const targetView = document.getElementById(`view-${viewName}`);
  if (targetView) {
    targetView.classList.add("active");
  }

  // Highlight active nav item
  const targetNav = document.getElementById(`nav-${viewName}`);
  if (targetNav) {
    targetNav.classList.add("active");
  }

  // Window scroll to top
  window.scrollTo({ top: 0, behavior: "smooth" });

  // Refresh view-specific logic
  if (viewName === "directory") {
    renderDirectory();
  } else if (viewName === "active-members") {
    renderActiveMembers();
  } else if (viewName === "admin") {
    renderAdminQueue();
  }
}

// 3. Render "Our Abroad Alumni" & "Elite Alumni" on Home
function renderHomeSpotlights() {
  const alumni = getAlumniData();

  // Render Abroad Alumni
  const abroadList = alumni.filter(a => a.is_abroad);
  const abroadContainer = document.getElementById("abroad-alumni-grid");
  if (abroadContainer) {
    abroadContainer.innerHTML = abroadList.map(a => `
      <div class="alumnus-card">
        <div class="alumnus-card-header">
          <div class="alumnus-avatar-wrapper">
            ${a.img_url 
              ? `<img src="${a.img_url}" alt="${a.firstname} ${a.lastname}" class="alumnus-avatar">`
              : `<div class="alumnus-avatar" style="background:${a.avatar_color || '#003366'}">${a.firstname[0]}${a.lastname[0]}</div>`
            }
            <span class="country-flag-badge" title="${a.companyloc}">${a.country_flag || '🌐'}</span>
          </div>
          <div class="alumnus-info">
            <h4>${a.firstname} ${a.lastname}</h4>
            <div class="alumnus-company">
              <i class="fas fa-building" style="font-size:0.8rem; color:#005cb9;"></i>
              ${a.connected_to}
            </div>
          </div>
        </div>
        <div class="alumnus-card-body">
          <div class="alumnus-meta-row">
            <div class="meta-item">
              <i class="fas fa-briefcase"></i>
              <span>${a.pos}</span>
            </div>
            <div class="meta-item">
              <i class="fas fa-map-marker-alt"></i>
              <span>${a.companyloc}</span>
            </div>
            <div class="meta-item">
              <i class="fas fa-graduation-cap"></i>
              <span>${a.course} (${a.college})</span>
            </div>
          </div>
          <div class="alumnus-tags">
            <span class="tag tag-batch">Class of ${a.batch}</span>
            <span class="tag tag-sector">${a.companysector}</span>
            ${a.is_bistaa_member ? `<span class="tag" style="background:#ecfdf5;color:#047857;"><i class="fas fa-check-circle"></i> BISTAA Active</span>` : ''}
          </div>
        </div>
      </div>
    `).join("");
  }

  // Render Elite Alumni Grid
  const eliteList = alumni.filter(a => a.is_elite);
  const eliteContainer = document.getElementById("elite-alumni-grid");
  if (eliteContainer) {
    eliteContainer.innerHTML = eliteList.map(a => `
      <div class="elite-card">
        ${a.img_url 
          ? `<img src="${a.img_url}" alt="${a.firstname}" class="elite-avatar">`
          : `<div class="elite-avatar" style="background:${a.avatar_color || '#002244'}">${a.firstname[0]}${a.lastname[0]}</div>`
        }
        <h4>${a.firstname} ${a.lastname}</h4>
        <div class="elite-role">${a.pos} @ ${a.connected_to}</div>
        <div class="elite-dept">${a.college} • ${a.course} (Batch ${a.batch})</div>
        <div style="margin-top:0.75rem;">
          <span style="font-size:0.75rem; color:#f59e0b; font-weight:700; background:rgba(245,158,11,0.15); padding:3px 8px; border-radius:999px;">
            <i class="fas fa-star"></i> Elite Member
          </span>
        </div>
      </div>
    `).join("");
  }
}

// 4. Render Directory with Sector Tabs and Filters
function filterBySector(sector) {
  currentActiveSector = sector;
  document.querySelectorAll(".sector-tab-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.sector === sector);
  });
  renderDirectory();
}

function renderDirectory() {
  const alumni = getAlumniData();
  const searchInput = document.getElementById("dir-search-input")?.value.toLowerCase().trim() || "";
  const collegeFilter = document.getElementById("dir-college-filter")?.value || "ALL";
  const batchFilter = document.getElementById("dir-batch-filter")?.value || "ALL";

  const filtered = alumni.filter(a => {
    // Sector filter
    if (currentActiveSector !== "All" && a.companysector !== currentActiveSector) {
      return false;
    }
    // College filter
    if (collegeFilter !== "ALL" && a.college !== collegeFilter) {
      return false;
    }
    // Batch filter
    if (batchFilter !== "ALL" && String(a.batch) !== batchFilter) {
      return false;
    }
    // Search query
    if (searchInput) {
      const haystack = `${a.firstname} ${a.lastname} ${a.connected_to} ${a.pos} ${a.course} ${a.companyloc} ${a.enroll_no}`.toLowerCase();
      if (!haystack.includes(searchInput)) {
        return false;
      }
    }
    return true;
  });

  const countEl = document.getElementById("directory-results-count");
  if (countEl) {
    countEl.innerText = `${filtered.length} Alumni Found`;
  }

  const container = document.getElementById("directory-grid");
  if (!container) return;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align:center; padding: 4rem 1rem; background:#fff; border-radius:12px; border:1px solid #e2e8f0;">
        <i class="fas fa-user-slash" style="font-size:3rem; color:#94a3b8; margin-bottom:1rem;"></i>
        <h3 style="color:#0f172a; margin-bottom:0.5rem;">No Alumni Matching Your Filter</h3>
        <p style="color:#64748b; font-size:0.9rem;">Try selecting a different sector, resetting your search keyword, or passout year.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(a => `
    <div class="alumnus-card">
      <div class="alumnus-card-header">
        <div class="alumnus-avatar-wrapper">
          ${a.img_url 
            ? `<img src="${a.img_url}" alt="${a.firstname}" class="alumnus-avatar">`
            : `<div class="alumnus-avatar" style="background:${a.avatar_color || '#004080'}">${a.firstname[0]}${a.lastname[0]}</div>`
          }
          <span class="country-flag-badge">${a.country_flag || '📍'}</span>
        </div>
        <div class="alumnus-info">
          <h4>${a.firstname} ${a.lastname}</h4>
          <div class="alumnus-company">${a.connected_to}</div>
        </div>
      </div>
      <div class="alumnus-card-body">
        <div class="alumnus-meta-row">
          <div class="meta-item">
            <i class="fas fa-briefcase"></i>
            <span>${a.pos}</span>
          </div>
          <div class="meta-item">
            <i class="fas fa-map-marker-alt"></i>
            <span>${a.companyloc}</span>
          </div>
          <div class="meta-item">
            <i class="fas fa-university"></i>
            <span>${a.college} • ${a.course}</span>
          </div>
        </div>
        <div class="alumnus-tags" style="margin-bottom:1rem;">
          <span class="tag tag-batch">Batch ${a.batch}</span>
          <span class="tag tag-sector">${a.companysector}</span>
          ${a.is_bistaa_member ? `<span class="tag" style="background:#ecfdf5;color:#047857;"><i class="fas fa-shield-alt"></i> BISTAA Active</span>` : ''}
        </div>
        <button class="btn btn-secondary btn-sm" onclick="openConnectModal('${a.id}')" style="width:100%;">
          <i class="fas fa-envelope"></i> Connect with Alumnus
        </button>
      </div>
    </div>
  `).join("");
}

// 5. Render BISTAA Active Members (Vista Members)
function renderActiveMembers() {
  const alumni = getAlumniData().filter(a => a.is_bistaa_member);
  const container = document.getElementById("active-members-grid");
  if (!container) return;

  container.innerHTML = alumni.map(a => `
    <div class="alumnus-card" style="border: 1.5px solid #a7f3d0;">
      <div class="alumnus-card-header" style="background: linear-gradient(135deg, #ecfdf5, #f0fdf4);">
        <div class="alumnus-avatar-wrapper">
          ${a.img_url 
            ? `<img src="${a.img_url}" alt="${a.firstname}" class="alumnus-avatar">`
            : `<div class="alumnus-avatar" style="background:#047857">${a.firstname[0]}${a.lastname[0]}</div>`
          }
          <span class="country-flag-badge">🎖️</span>
        </div>
        <div class="alumnus-info">
          <h4>${a.firstname} ${a.lastname}</h4>
          <span class="bistaa-chip" style="font-size:0.675rem; padding:2px 8px;">
            <i class="fas fa-check"></i> ${a.bistaa_id || 'Active Member'}
          </span>
        </div>
      </div>
      <div class="alumnus-card-body">
        <div class="alumnus-meta-row">
          <div class="meta-item">
            <i class="fas fa-building"></i>
            <span><b>${a.connected_to}</b> (${a.pos})</span>
          </div>
          <div class="meta-item">
            <i class="fas fa-graduation-cap"></i>
            <span>${a.college} • ${a.course} (Batch ${a.batch})</span>
          </div>
          <div class="meta-item">
            <i class="fas fa-map-marker-alt"></i>
            <span>${a.companyloc}</span>
          </div>
        </div>
        <button class="btn btn-outline-gold btn-sm" onclick="trackStatusWithEnroll('${a.enroll_no}')" style="width:100%;">
          <i class="fas fa-id-card"></i> View Digital Pass
        </button>
      </div>
    </div>
  `).join("");
}

// 6. BISTAA Membership Form Logic (bistaa_form.php Modernized)
function handleEnrollmentAutocomplete(value) {
  const query = value.trim().toUpperCase();
  const nameInput = document.getElementById("bistaa-name");
  const branchInput = document.getElementById("bistaa-branch");
  const collegeInput = document.getElementById("bistaa-college");
  const feedbackEl = document.getElementById("enroll-feedback");

  if (query.length < 4) {
    if (feedbackEl) feedbackEl.innerHTML = "";
    return;
  }

  const alumni = getAlumniData();
  const match = alumni.find(a => a.enroll_no.toUpperCase() === query);

  if (match) {
    nameInput.value = `${match.firstname} ${match.lastname}`;
    branchInput.value = match.course;
    collegeInput.value = match.college;
    if (feedbackEl) {
      feedbackEl.innerHTML = `<span style="color:#10b981;"><i class="fas fa-check-circle"></i> Alumnus record detected: ${match.firstname} ${match.lastname} (${match.college} - ${match.course})</span>`;
    }
  } else {
    // Branch deduction from pattern
    let inferred = "General Engineering";
    if (query.includes("CS")) inferred = "Computer Science Engg.";
    else if (query.includes("IT")) inferred = "Information Technology";
    else if (query.includes("ME")) inferred = "Mechanical Engg.";
    else if (query.includes("EC")) inferred = "Electronic & Communication";
    else if (query.includes("EE")) inferred = "Electrical Engg.";
    else if (query.includes("CE")) inferred = "Civil Engg";

    branchInput.value = inferred;
    if (feedbackEl) {
      feedbackEl.innerHTML = `<span style="color:#64748b;"><i class="fas fa-info-circle"></i> Branch auto-detected: ${inferred}. Please complete normal registration if you haven't yet.</span>`;
    }
  }
}

function handleBistaaFormSubmit(event) {
  event.preventDefault();

  const enrollNo = document.getElementById("bistaa-enroll").value.trim().toUpperCase();
  const name = document.getElementById("bistaa-name").value.trim();
  const branch = document.getElementById("bistaa-branch").value.trim();
  const college = document.getElementById("bistaa-college").value.trim();
  const utr = document.getElementById("bistaa-utr").value.trim();

  // Validate UTR
  if (!/^\d{12}$/.test(utr)) {
    showToast("UPI Transaction ID must be exactly 12 digits!", "error");
    return;
  }

  // Check duplicate UTR
  const apps = getBistaaApplications();
  if (apps.some(a => a.upi_transaction_id === utr)) {
    showToast("This UPI Transaction ID has already been submitted!", "error");
    return;
  }

  // Create new application
  const newApp = {
    id: `app-${Date.now()}`,
    enrollment: enrollNo,
    name: name,
    branch: branch,
    college: college,
    batch: 2024,
    amount: "300",
    upi_transaction_id: utr,
    transaction_slip: "assets/bistaa_qr.jpg", // Preview slip
    status: "PENDING_VERIFICATION",
    membership_id: null,
    submitted_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
    verified_at: null
  };

  apps.unshift(newApp);
  saveBistaaApplications(apps);

  showToast("Application submitted successfully! Redirecting to tracker...", "success");

  // Reset form
  document.getElementById("bistaa-membership-form").reset();

  // Switch to Status Tracker view automatically
  setTimeout(() => {
    trackStatusWithEnroll(enrollNo);
  }, 1000);
}

// 7. Status Tracker Logic (bistaa_status.php Modernized)
function trackStatusWithEnroll(enrollNo) {
  showView("status");
  const input = document.getElementById("status-enroll-input");
  if (input) {
    input.value = enrollNo;
  }
  executeStatusQuery();
}

function executeStatusQuery() {
  const input = document.getElementById("status-enroll-input");
  const query = input?.value.trim().toUpperCase();
  const resultBox = document.getElementById("status-result-area");
  const errorBox = document.getElementById("status-error-area");

  if (!query) {
    showToast("Please enter an Enrollment Number", "error");
    return;
  }

  const apps = getBistaaApplications();
  const record = apps.find(a => a.enrollment.toUpperCase() === query);

  if (!record) {
    if (resultBox) resultBox.style.display = "none";
    if (errorBox) {
      errorBox.innerHTML = `
        <div style="background:#fef2f2; border:1px solid #fecaca; color:#991b1b; padding:1.25rem; border-radius:10px; text-align:center;">
          <i class="fas fa-exclamation-circle" style="font-size:1.5rem; margin-bottom:0.5rem; display:block;"></i>
          <b>No BISTAA Application found for "${query}"</b>
          <p style="font-size:0.85rem; margin-top:0.35rem;">Please check the enrollment number spelling, or submit the ₹300 BISTAA registration form first.</p>
        </div>
      `;
    }
    return;
  }

  if (errorBox) errorBox.innerHTML = "";
  if (resultBox) resultBox.style.display = "block";

  // Stepper state
  const isApproved = (record.status === "ACTIVE");
  const stepReview = document.getElementById("step-review");
  const stepActive = document.getElementById("step-active");

  if (isApproved) {
    stepReview?.classList.add("completed");
    stepActive?.classList.add("completed", "active");
  } else {
    stepReview?.classList.add("active");
    stepReview?.classList.remove("completed");
    stepActive?.classList.remove("completed", "active");
  }

  // Populate Details
  document.getElementById("res-enroll").innerText = record.enrollment;
  document.getElementById("res-name").innerText = record.name;
  document.getElementById("res-branch").innerText = `${record.branch} (${record.college})`;
  document.getElementById("res-amount").innerText = `₹${record.amount}/- (Paid)`;
  document.getElementById("res-upi").innerText = record.upi_transaction_id;
  document.getElementById("res-time").innerText = record.submitted_at;

  const statusBadge = document.getElementById("res-status-badge");
  if (statusBadge) {
    if (isApproved) {
      statusBadge.innerHTML = `<span class="bistaa-chip" style="background:#10b981;"><i class="fas fa-check-circle"></i> ACTIVE BISTAA MEMBER</span>`;
    } else {
      statusBadge.innerHTML = `<span class="bistaa-chip" style="background:#f59e0b;"><i class="fas fa-clock"></i> PENDING VERIFICATION</span>`;
    }
  }

  // Render Digital Identity Card if approved
  const passContainer = document.getElementById("digital-pass-container");
  if (passContainer) {
    if (isApproved) {
      passContainer.innerHTML = `
        <div class="digital-membership-pass">
          <div class="pass-header">
            <div class="pass-title">
              <h4>Bansal Group of Institutions Alumni Association</h4>
              <p>OFFICIAL DIGITAL IDENTITY PASS • BISTAA</p>
            </div>
            <div style="font-size:1.5rem; color:#f59e0b;">🏛️</div>
          </div>
          <div class="pass-body">
            <div class="pass-avatar" style="background:#0284c7; display:flex; align-items:center; justify-content:center; color:#fff; font-weight:700; font-size:1.5rem;">
              ${record.name.split(' ').map(n=>n[0]).join('')}
            </div>
            <div class="pass-fields">
              <div>
                <div class="pass-field-label">Member Name</div>
                <div class="pass-field-value">${record.name}</div>
              </div>
              <div>
                <div class="pass-field-label">Enrollment Number</div>
                <div class="pass-field-value" style="font-family:var(--font-mono);">${record.enrollment}</div>
              </div>
              <div>
                <div class="pass-field-label">College & Branch</div>
                <div class="pass-field-value">${record.college} - ${record.branch}</div>
              </div>
              <div>
                <div class="pass-field-label">Membership ID</div>
                <div class="pass-field-value" style="color:#f59e0b; font-family:var(--font-mono);">${record.membership_id || 'BISTAA-LIFETIME'}</div>
              </div>
            </div>
            <div style="text-align:center;">
              <img src="assets/bistaa_qr.jpg" alt="QR" style="width:72px; height:72px; border-radius:6px; border:2px solid #fff;">
              <span style="font-size:0.65rem; color:#cbd5e1; display:block; margin-top:2px;">Scan to Verify</span>
            </div>
          </div>
        </div>
        <div style="margin-top:1rem; text-align:right;">
          <button class="btn btn-secondary btn-sm" onclick="window.print()">
            <i class="fas fa-print"></i> Print Official Card
          </button>
        </div>
      `;
    } else {
      passContainer.innerHTML = `
        <div style="background:#f8fafc; border:1px dashed #cbd5e1; border-radius:12px; padding:1.5rem; text-align:center; color:#64748b;">
          <i class="fas fa-id-card-alt" style="font-size:2rem; margin-bottom:0.5rem; color:#94a3b8;"></i>
          <p style="font-weight:600;">Digital Member Pass will be unlocked once admin verifies your ₹300 UPI transaction.</p>
          <p style="font-size:0.8rem; margin-top:0.25rem;">Usually approved within 4–12 hours.</p>
        </div>
      `;
    }
  }
}

// 8. Admin Verification Portal Logic
function renderAdminQueue() {
  const apps = getBistaaApplications();
  const tbody = document.getElementById("admin-table-body");
  if (!tbody) return;

  const pendingCount = apps.filter(a => a.status === "PENDING_VERIFICATION").length;
  const countEl = document.getElementById("admin-pending-badge");
  if (countEl) {
    countEl.innerText = `${pendingCount} Pending Verifications`;
  }

  tbody.innerHTML = apps.map(app => `
    <tr>
      <td>
        <b>${app.name}</b><br>
        <span style="font-size:0.75rem; color:#64748b;">Batch ${app.batch || 'N/A'}</span>
      </td>
      <td style="font-family:var(--font-mono); font-weight:600;">${app.enrollment}</td>
      <td>${app.branch} (${app.college})</td>
      <td style="font-family:var(--font-mono); font-weight:700; color:#004080;">${app.upi_transaction_id}</td>
      <td>
        <img src="${app.transaction_slip}" alt="Slip" class="slip-thumbnail" onclick="openSlipModal('${app.transaction_slip}', '${app.upi_transaction_id}', '${app.name}')" title="Click to view slip">
      </td>
      <td>
        ${app.status === 'ACTIVE' 
          ? `<span class="bistaa-chip" style="background:#10b981;"><i class="fas fa-check"></i> ACTIVE</span>`
          : `<span class="bistaa-chip" style="background:#f59e0b;"><i class="fas fa-hourglass-half"></i> PENDING</span>`
        }
      </td>
      <td>
        ${app.status === 'ACTIVE'
          ? `<button class="btn btn-sm" disabled style="background:#e2e8f0; color:#94a3b8; cursor:default;"><i class="fas fa-check-double"></i> Activated</button>`
          : `<button class="btn btn-primary btn-sm" onclick="adminActivateApplication('${app.id}')"><i class="fas fa-user-check"></i> Activate Member</button>`
        }
      </td>
    </tr>
  `).join("");
}

function adminActivateApplication(appId) {
  const apps = getBistaaApplications();
  const target = apps.find(a => a.id === appId);
  if (!target) return;

  target.status = "ACTIVE";
  target.membership_id = `BISTAA-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  target.verified_at = new Date().toISOString().replace('T', ' ').substring(0, 19);

  saveBistaaApplications(apps);

  // Also update or add to ALUMNI database if needed
  const alumni = getAlumniData();
  const existingAlum = alumni.find(a => a.enroll_no.toUpperCase() === target.enrollment.toUpperCase());
  if (existingAlum) {
    existingAlum.is_bistaa_member = true;
    existingAlum.bistaa_id = target.membership_id;
    saveAlumniData(alumni);
  }

  showToast(`Successfully activated ${target.name} as BISTAA Lifetime Member!`, "success");
  renderAdminQueue();
}

function openSlipModal(imgSrc, utr, name) {
  const modal = document.getElementById("slip-preview-modal");
  const modalImg = document.getElementById("slip-modal-img");
  const modalDesc = document.getElementById("slip-modal-desc");

  if (modalImg) modalImg.src = imgSrc;
  if (modalDesc) modalDesc.innerHTML = `<b>${name}</b> • UPI UTR: <code>${utr}</code> • Fee: ₹300`;
  if (modal) modal.classList.add("active");
}

function closeSlipModal() {
  const modal = document.getElementById("slip-preview-modal");
  if (modal) modal.classList.remove("active");
}

// 9. Generic Modals & Toasts
function openConnectModal(alumniId) {
  const alumni = getAlumniData();
  const alum = alumni.find(a => a.id === alumniId);
  if (!alum) return;

  const modal = document.getElementById("connect-modal");
  const nameEl = document.getElementById("connect-modal-name");
  const roleEl = document.getElementById("connect-modal-role");

  if (nameEl) nameEl.innerText = `${alum.firstname} ${alum.lastname}`;
  if (roleEl) roleEl.innerText = `${alum.pos} @ ${alum.connected_to} (${alum.companyloc})`;
  if (modal) modal.classList.add("active");
}

function closeConnectModal() {
  const modal = document.getElementById("connect-modal");
  if (modal) modal.classList.remove("active");
}

function handleConnectSubmit(e) {
  e.preventDefault();
  closeConnectModal();
  showToast("Your connection request and message have been sent to the alumnus!", "success");
}

function rsvpEvent(eventTitle) {
  showToast(`RSVP Confirmed for "${eventTitle}"! Digital pass sent to your email.`, "success");
}

function showToast(message, type = "success") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}" style="color:${type === 'success' ? '#10b981' : '#ef4444'}"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 4000);
}

// 10. Initialization on Load
document.addEventListener("DOMContentLoaded", () => {
  renderHomeSpotlights();
  renderDirectory();

  // Sticky Navbar scroll effect
  window.addEventListener("scroll", () => {
    const nav = document.querySelector(".main-navbar");
    if (nav) {
      nav.classList.toggle("scrolled", window.scrollY > 20);
    }
  });
});
