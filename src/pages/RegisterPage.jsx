import React, { useState } from 'react';
import ImageUploadField from '../components/ImageUploadField';
import SubmissionSuccessModal from '../components/SubmissionSuccessModal';
import { 
  UserPlus, 
  CheckCircle2, 
  GraduationCap, 
  Building, 
  MapPin, 
  Mail, 
  Phone, 
  Linkedin, 
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';

const INDIAN_STATES = [
  "Madhya Pradesh", "Maharashtra", "Uttar Pradesh", "Delhi NCR", "Rajasthan",
  "Gujarat", "Karnataka", "Tamil Nadu", "Telangana", "Bihar", "Chhattisgarh",
  "West Bengal", "Punjab", "Haryana", "Jharkhand", "Odisha", "Uttarakhand",
  "Himachal Pradesh", "Kerala", "Assam", "Goa", "Other State / Union Territory"
];

export default function RegisterPage({ onAddAlumnus, setView, showToast }) {
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    gender: 'Male',
    native_state: 'Madhya Pradesh',
    native_place: '',
    college: 'BIST',
    batch: 2023,
    course: 'Computer Science Engg.',
    enroll_no: '',
    companysector: 'Private',
    connected_to: '',
    pos: '',
    comploc: 'INDIA',
    companyloc: '',
    email: '',
    phone_no: '',
    linkedinid: '',
    bio: ''
  });

  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submission, setSubmission] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const cleanEnroll = formData.enroll_no.trim().toUpperCase();

    const newAlumnus = {
      id: `alum-${Date.now()}`,
      ...formData,
      enroll_no: cleanEnroll,
      batch: parseInt(formData.batch, 10),
      img_url: avatarPreview,
      avatar_color: '#002244',
      country_flag: formData.comploc === 'ABROAD' ? '🌐' : '🇮🇳',
      country_name: formData.comploc === 'ABROAD' ? 'Abroad' : 'India',
      is_abroad: formData.comploc === 'ABROAD',
      is_elite: false,
      is_bistaa_member: false,
      bistaa_id: null
    };

    setIsSubmitting(true);
    try {
      const result = await onAddAlumnus(newAlumnus, avatarFile);
      try {
        confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
      } catch (e) {}
      setSubmission({ name: `${formData.firstname} ${formData.lastname}`.trim(), reference: result?.id || '' });
    } catch (error) {
      showToast(error.message || 'Registration could not be saved. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '80vh' }}>
      
      {/* Premium Hero Band */}
      <div className="page-hero-band">
        <div className="container" style={{ maxWidth: 980 }}>
          <div className="page-hero-eyebrow">
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>person_add</span>
            Join the Verified Global Alumni Directory
          </div>
          <h1 className="page-hero-title">Standard Alumni Registration</h1>
          <p className="page-hero-desc">
            Register your graduation credentials with the Bansal Group of Institutions Alumni Database. 
            Connect with fellow graduates worldwide and add your verified profile to the alumni directory.
          </p>
        </div>
      </div>

      <div className="page-content-section">
        <div className="container" style={{ maxWidth: 880 }}>

        {/* Form Card */}
        <div className="form-card registration-form-card">
          <form className="registration-form" onSubmit={handleSubmit}>

            {/* Section 1: Personal Details */}
            <h3 className="registration-section-title"><span>01</span> Personal Information</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">First Name <span className="req">*</span></label>
                <input
                  type="text"
                  name="firstname"
                  className="form-input"
                  placeholder="Your first name"
                  required
                  value={formData.firstname}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Last Name <span className="req">*</span></label>
                <input
                  type="text"
                  name="lastname"
                  className="form-input"
                  placeholder="Your last name"
                  required
                  value={formData.lastname}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Gender <span className="req">*</span></label>
                <select name="gender" className="select-field" value={formData.gender} onChange={handleChange}>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Native State <span className="req">*</span></label>
                <select name="native_state" className="select-field" value={formData.native_state} onChange={handleChange}>
                  {INDIAN_STATES.map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Native City / Hometown <span className="req">*</span></label>
                <input
                  type="text"
                  name="native_place"
                  className="form-input"
                  placeholder="e.g. Bhopal, Indore, Jabalpur"
                  required
                  value={formData.native_place}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Section 2: Academic Details */}
            <h3 className="registration-section-title"><span>02</span> Academic Credentials</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="registration-enrollment">Enrollment Number</label>
                <input
                  type="text"
                  id="registration-enrollment"
                  name="enroll_no"
                  className="form-input"
                  placeholder="Enter your enrollment number"
                  style={{ fontFamily: 'var(--font-mono)' }}
                  value={formData.enroll_no}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Passout Batch (Year) <span className="req">*</span></label>
                <select name="batch" className="select-field" value={formData.batch} onChange={handleChange}>
                  {Array.from({ length: new Date().getFullYear() - 1980 + 1 }, (_, index) => new Date().getFullYear() - index).map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Constituent College <span className="req">*</span></label>
                <select name="college" className="select-field" value={formData.college} onChange={handleChange}>
                  <option value="BIST">Bansal Institute of Science &amp; Technology (BIST)</option>
                  <option value="BIRT">Bansal Institute of Research &amp; Technology (BIRT)</option>
                  <option value="BIRTS">Bansal Institute of Research, Technology &amp; Science (BIRTS)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Course / Degree &amp; Branch <span className="req">*</span></label>
                <select name="course" className="select-field" value={formData.course} onChange={handleChange}>
                  <option value="Computer Science Engg.">Computer Science Engg. (B.Tech)</option>
                  <option value="Information Technology">Information Technology (B.Tech)</option>
                  <option value="Electronic & Communication">Electronic &amp; Communication (B.Tech)</option>
                  <option value="Electrical Engg.">Electrical Engg. (B.Tech)</option>
                  <option value="Mechanical Engg.">Mechanical Engg. (B.Tech)</option>
                  <option value="Civil Engg">Civil Engg (B.Tech)</option>
                  <option value="Master of Business Administration">MBA (Management)</option>
                  <option value="Master of Computer Applications">MCA (Computer Applications)</option>
                </select>
              </div>
            </div>

            {/* Section 3: Professional Employment */}
            <h3 className="registration-section-title"><span>03</span> Current Professional Employment</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Working Sector <span className="req">*</span></label>
                <select name="companysector" className="select-field" value={formData.companysector} onChange={handleChange}>
                  <option value="Private">Private Sector</option>
                  <option value="Government">Government Sector</option>
                  <option value="Semi-Government">Semi-Government / PSU</option>
                  <option value="Self Employed">Self Employed / Entrepreneur</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Current Employer / Organization <span className="req">*</span></label>
                <input
                  type="text"
                  name="connected_to"
                  className="form-input"
                  placeholder="e.g. Amazon, ISRO, TCS, Self-Owned Firm"
                  required
                  value={formData.connected_to}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Job Title / Designation <span className="req">*</span></label>
                <input
                  type="text"
                  name="pos"
                  className="form-input"
                  placeholder="e.g. Software Engineer, Scientist 'SC'"
                  required
                  value={formData.pos}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Location Type <span className="req">*</span></label>
                <select name="comploc" className="select-field" value={formData.comploc} onChange={handleChange}>
                  <option value="INDIA">India</option>
                  <option value="ABROAD">Abroad (International)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Work City / Country <span className="req">*</span></label>
                <input
                  type="text"
                  name="companyloc"
                  className="form-input"
                  placeholder="e.g. Bengaluru, India or Seattle, USA"
                  required
                  value={formData.companyloc}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Section 4: Contact & Socials */}
            <h3 className="registration-section-title"><span>04</span> Contact &amp; Professional Socials</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Email Address <span className="req">*</span></label>
                <input
                  type="email"
                  name="email"
                  className="form-input"
                  placeholder="name@company.com"
                  required
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Mobile Phone Number <span className="req">*</span></label>
                <input
                  type="tel"
                  name="phone_no"
                  className="form-input"
                  placeholder="10-digit mobile number"
                  required
                  value={formData.phone_no}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">LinkedIn Profile URL</label>
              <input
                type="url"
                name="linkedinid"
                className="form-input"
                placeholder="https://linkedin.com/in/yourprofile"
                value={formData.linkedinid}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Professional Summary / Bio</label>
              <textarea
                name="bio"
                className="form-input"
                rows={3}
                placeholder="Brief summary of your professional journey and key technical areas..."
                value={formData.bio}
                onChange={handleChange}
              />
            </div>

            {/* Profile Avatar Upload */}
            <div className="form-group">
              <label className="form-label">Profile Avatar / Photo</label>
              <ImageUploadField
                id="avatar-input"
                value={avatarPreview}
                variant="profile"
                title="Profile photo"
                description="JPG, PNG or WebP · Up to 5 MB · Optional"
                onChange={({ file, preview }) => { setAvatarFile(file); setAvatarPreview(preview); }}
                onRemove={() => { setAvatarFile(null); setAvatarPreview(null); }}
                onError={(message) => showToast(message, 'error')}
              />
            </div>

            {/* Submit */}
            <div style={{ marginTop: '2rem' }}>
              <button 
                type="submit" 
                className="btn btn-primary btn-lg" 
                disabled={isSubmitting}
                style={{ width: '100%' }}
              >
                <UserPlus size={18} /> {isSubmitting ? 'Submitting your profile…' : 'Complete Registration & Join Directory'}
              </button>
            </div>

          </form>
        </div>

        </div>
      </div>
      {submission && <SubmissionSuccessModal
        eyebrow="PROFILE SUBMITTED"
        title={`Thanks, ${submission.name.split(' ')[0]}!`}
        message="Your alumni profile has been received and is awaiting institutional verification. It will appear in the directory once approved."
        reference={submission.reference}
        actionLabel="Explore the directory"
        onAction={() => setView('directory')}
      />}
    </div>
  );
}
