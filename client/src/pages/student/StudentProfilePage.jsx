import { useEffect, useState } from 'react';
import SectionCard from '../../components/common/SectionCard';
import { fetchStudentProfile, updateStudentProfile, uploadProfilePhoto } from '../../services/studentApi';
import { useAuth } from '../../context/AuthContext';
import { readCacheSync } from '../../utils/cache';

const emptyProfile = {
  name: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  gender: '',
  currentCity: '',
  state: '',
  country: '',
  linkedinUrl: '',
  githubUrl: '',
  portfolioUrl: '',
  resumeFileUrl: '',
  academicInfo: {
    university: '',
    degree: '',
    graduationYear: '',
    cgpa: '',
    department: '',
  },
  careerGoal: '',
  targetRole: '',
  portfolio: { summary: '' },
  completion: { percentage: 0, isComplete: false },
};

function StudentProfilePage() {
  const { updateUser } = useAuth();
  
  const cachedProf = readCacheSync('profile');
  const initialProfile = cachedProf ? {
    ...emptyProfile,
    ...(cachedProf.profile || {}),
    academicInfo: {
      ...emptyProfile.academicInfo,
      ...((cachedProf.profile && cachedProf.profile.academicInfo) || {}),
    },
  } : emptyProfile;

  const [profile, setProfile] = useState(initialProfile);
  const [loading, setLoading] = useState(!cachedProf);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState('');
  const [photoError, setPhotoError] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function loadProfile() {
      try {
        setLoading(true);
        const setFormattedProfile = (data) => {
          if (!isMounted) return;
          setProfile({
            ...emptyProfile,
            ...(data.profile || {}),
            academicInfo: {
              ...emptyProfile.academicInfo,
              ...((data.profile && data.profile.academicInfo) || {}),
            },
          });
        };
        const response = await fetchStudentProfile(setFormattedProfile);
        setFormattedProfile(response);
      } catch (loadError) {
        if (isMounted) setError(loadError.message || 'Unable to load profile.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadProfile();
    return () => { isMounted = false; };
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    if (name.startsWith('academicInfo.')) {
      const key = name.split('.')[1];
      setProfile((current) => ({
        ...current,
        academicInfo: {
          ...current.academicInfo,
          [key]: value,
        },
      }));
      return;
    }

    if (name.startsWith('portfolio.')) {
      const key = name.split('.')[1];
      setProfile((current) => ({
        ...current,
        portfolio: {
          ...current.portfolio,
          [key]: value,
        },
      }));
      return;
    }

    setProfile((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response = await updateStudentProfile(profile);
      setProfile({
        ...emptyProfile,
        ...(response.profile || {}),
        academicInfo: {
          ...emptyProfile.academicInfo,
          ...((response.profile && response.profile.academicInfo) || {}),
        },
      });
      updateUser({ 
        name: response.profile.name, 
        profilePhoto: response.profile.profilePhoto 
      });
    } catch (submitError) {
      setError(submitError.message || 'Unable to save profile.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setPhotoError('Profile photo must be JPG, PNG, or WebP.');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('Profile photo is too large. Maximum allowed size is 5 MB.');
      return;
    }
    
    setUploadingPhoto(true);
    setPhotoError('');

    try {
      const response = await uploadProfilePhoto(file);
      setProfile((current) => ({
        ...current,
        profilePhoto: response.photoUrl
      }));
      updateUser({ profilePhoto: response.photoUrl });
    } catch (err) {
      setPhotoError(err.message || 'Failed to upload photo.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
  const getFullPhotoUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${API_BASE_URL.replace('/api', '')}${url}`;
  };

  if (loading) {
    return <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">Loading profile…</div>;
  }

  const completionPct = profile.completion?.percentage || 0;

  return (
    <div className="space-y-6">
      <SectionCard title="Profile Completion">
        <div className="mb-2 flex items-center justify-between text-sm font-medium">
          <span className="text-slate-700">Completion Status</span>
          <span className="text-brand-600">{completionPct}%</span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-2.5 rounded-full bg-brand-600"
            style={{ width: `${completionPct}%` }}
          ></div>
        </div>
        {completionPct < 100 && profile.completion?.requirements && (
          <div className="mt-4 space-y-1 text-sm text-slate-600">
            <p>Missing requirements:</p>
            <ul className="list-inside list-disc">
              {!profile.completion.requirements.personal && <li>Personal Information (Name, Phone, City)</li>}
              {!profile.completion.requirements.education && <li>Education Details</li>}
              {!profile.completion.requirements.resume && <li>Resume</li>}
              {!profile.completion.requirements.skills && <li>Skills</li>}
              {!profile.completion.requirements.projects && <li>Projects</li>}
              {!profile.completion.requirements.links && <li>Professional Links</li>}
            </ul>
          </div>
        )}
      </SectionCard>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <SectionCard title="Personal Information" subtitle="Your contact and location details">
          
          <div className="mb-6 flex items-center gap-6 rounded-lg border border-slate-200 p-4 bg-slate-50">
            <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-full bg-slate-200 border-2 border-white shadow-sm">
              {profile.profilePhoto ? (
                <img src={getFullPhotoUrl(profile.profilePhoto)} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-slate-400">
                  <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-800">Profile Photo</p>
              <p className="text-xs text-slate-500 mb-3">JPG, PNG, or WebP. Max 5MB.</p>
              
              <label className="cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
                {uploadingPhoto ? 'Uploading...' : (profile.profilePhoto ? 'Change Photo' : 'Upload Photo')}
                <input 
                  type="file" 
                  accept=".jpg,.jpeg,.png,.webp" 
                  className="hidden" 
                  onChange={handlePhotoUpload} 
                  disabled={uploadingPhoto}
                />
              </label>
              {photoError && <p className="mt-2 text-xs text-red-600">{photoError}</p>}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <label className="space-y-2 text-sm text-slate-700">
              <span>Full Name</span>
              <input name="name" value={profile.name || ''} onChange={handleChange} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2" />
            </label>
            <label className="space-y-2 text-sm text-slate-700">
              <span>Email Address</span>
              <input name="email" type="email" disabled value={profile.email || ''} className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-slate-500 cursor-not-allowed" />
            </label>
            <label className="space-y-2 text-sm text-slate-700">
              <span>Phone Number</span>
              <input name="phone" value={profile.phone || ''} onChange={handleChange} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2" />
            </label>
            <label className="space-y-2 text-sm text-slate-700">
              <span>Date of Birth</span>
              <input name="dateOfBirth" type="date" value={profile.dateOfBirth ? profile.dateOfBirth.slice(0, 10) : ''} onChange={handleChange} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2" />
            </label>
            <label className="space-y-2 text-sm text-slate-700">
              <span>Gender</span>
              <select name="gender" value={profile.gender || ''} onChange={handleChange} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2">
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </label>
            <label className="space-y-2 text-sm text-slate-700">
              <span>Current City</span>
              <input name="currentCity" value={profile.currentCity || ''} onChange={handleChange} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2" />
            </label>
            <label className="space-y-2 text-sm text-slate-700">
              <span>State</span>
              <input name="state" value={profile.state || ''} onChange={handleChange} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2" />
            </label>
            <label className="space-y-2 text-sm text-slate-700">
              <span>Country</span>
              <input name="country" value={profile.country || ''} onChange={handleChange} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2" />
            </label>
          </div>
        </SectionCard>

        <SectionCard title="Professional Links" subtitle="Links to your online profiles and work">
          <div className="grid gap-6 md:grid-cols-2">
            <label className="space-y-2 text-sm text-slate-700">
              <span>LinkedIn URL</span>
              <input name="linkedinUrl" type="url" value={profile.linkedinUrl || ''} onChange={handleChange} placeholder="https://linkedin.com/in/..." className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2" />
            </label>
            <label className="space-y-2 text-sm text-slate-700">
              <span>GitHub URL</span>
              <input name="githubUrl" type="url" value={profile.githubUrl || ''} onChange={handleChange} placeholder="https://github.com/..." className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2" />
            </label>
            <label className="space-y-2 text-sm text-slate-700">
              <span>Portfolio URL</span>
              <input name="portfolioUrl" type="url" value={profile.portfolioUrl || ''} onChange={handleChange} placeholder="https://..." className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2" />
            </label>
          </div>
        </SectionCard>

        <SectionCard title="Student profile" subtitle="Academic details, career plan, and target role">
          <div className="grid gap-6 md:grid-cols-2">
            <label className="space-y-2 text-sm text-slate-700">
              <span>University</span>
              <input name="academicInfo.university" value={profile.academicInfo.university || ''} onChange={handleChange} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2" />
            </label>
            <label className="space-y-2 text-sm text-slate-700">
              <span>Department</span>
              <input name="academicInfo.department" value={profile.academicInfo.department || ''} onChange={handleChange} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2" />
            </label>
            <label className="space-y-2 text-sm text-slate-700">
              <span>Degree</span>
              <input name="academicInfo.degree" value={profile.academicInfo.degree || ''} onChange={handleChange} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2" />
            </label>
            <label className="space-y-2 text-sm text-slate-700">
              <span>Graduation year</span>
              <input name="academicInfo.graduationYear" type="number" value={profile.academicInfo.graduationYear || ''} onChange={handleChange} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2" />
            </label>
            <label className="space-y-2 text-sm text-slate-700">
              <span>CGPA</span>
              <input name="academicInfo.cgpa" value={profile.academicInfo.cgpa || ''} onChange={handleChange} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2" />
            </label>
            <label className="space-y-2 text-sm text-slate-700">
              <span>Target role</span>
              <input name="targetRole" value={profile.targetRole || ''} onChange={handleChange} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2" />
            </label>
          </div>

          <label className="block space-y-2 text-sm text-slate-700">
            <span>Career goal</span>
            <textarea name="careerGoal" rows="3" value={profile.careerGoal || ''} onChange={handleChange} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2" />
          </label>

          <label className="block space-y-2 text-sm text-slate-700">
            <span>Professional Summary</span>
            <textarea name="portfolio.summary" rows="4" value={profile.portfolio?.summary || ''} onChange={handleChange} placeholder="A short executive summary of your profile for recruiters." className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2" />
          </label>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <div className="flex justify-end">
            <button type="submit" disabled={submitting} className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60">
              {submitting ? 'Saving…' : 'Save profile'}
            </button>
          </div>
        </SectionCard>
      </form>
    </div>
  );
}

export default StudentProfilePage;
