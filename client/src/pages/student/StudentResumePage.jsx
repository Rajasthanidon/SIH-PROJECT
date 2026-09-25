import { useEffect, useState } from 'react';
import SectionCard from '../../components/common/SectionCard';
import { fetchStudentProfile, updateStudentProfile, uploadResume } from '../../services/studentApi';
import { readCacheSync } from '../../utils/cache';

function StudentResumePage() {
  const cachedProf = readCacheSync('profile');
  const [profile, setProfile] = useState(cachedProf ? cachedProf.profile || null : null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(!cachedProf);
  const [parsing, setParsing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function loadProfile() {
      try {
        setLoading(true);
        const setFormatted = (res) => { if(isMounted && res) setProfile(res.profile || null); };
        const response = await fetchStudentProfile(setFormatted);
        setFormatted(response);
      } catch (err) {
        if (isMounted) setError(err.message || 'Unable to load profile.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadProfile();
    return () => { isMounted = false; };
  }, []);

  const parsedData = profile?.resumeParsedData || null;

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a PDF file first.');
      return;
    }
    if (file.type !== 'application/pdf') {
      setError('Please upload your resume as a PDF file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Resume is too large. Maximum allowed size is 5 MB.');
      return;
    }
    
    setUploading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await uploadResume(file);
      setProfile(response.profile);
      
      if (!response.parsedData || !response.parsedData.detectedSkills || response.parsedData.detectedSkills.length === 0) {
        setSuccess('Resume uploaded successfully, but we couldn\'t extract information from this PDF. You can still keep the resume and enter your information manually.');
      } else {
        setSuccess('Resume uploaded and parsed successfully. Review the detected information before saving it to your profile.');
      }
      setFile(null);
    } catch (err) {
      if (err.payload?.profile) {
        setProfile(err.payload.profile);
      }
      setError(err.message || 'Something went wrong while saving your resume. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
  const getFullResumeUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${API_BASE_URL.replace('/api', '')}${url}`;
  };

  if (loading) {
    return <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">Loading resume details…</div>;
  }

  return (
    <div className="space-y-6">
      <SectionCard title="Resume & Parsing" subtitle="Upload your resume PDF and let our system extract your skills.">
        
        {profile?.resumeFileUrl ? (
          <div className="mb-6 rounded-lg border border-slate-200 p-4 bg-slate-50 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-800">Current Resume</p>
              <a href={getFullResumeUrl(profile.resumeFileUrl)} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-600 hover:underline">
                View Uploaded PDF
              </a>
            </div>
            <p className="text-xs text-slate-500">You can upload a new PDF below to replace this.</p>
          </div>
        ) : (
          <div className="mb-6 rounded-lg border border-slate-200 p-4 bg-slate-50">
            <p className="text-sm text-slate-500">No resume uploaded yet.</p>
          </div>
        )}

        <form onSubmit={handleUpload} className="mb-6 grid gap-4">
          <label className="space-y-2 text-sm text-slate-700">
            <span>Upload Resume (PDF only)</span>
            <div className="flex gap-2">
              <input 
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange} 
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 bg-white" 
              />
              <button 
                type="submit" 
                disabled={uploading || !file} 
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {uploading ? 'Uploading...' : 'Upload & Parse'}
              </button>
            </div>
          </label>
        </form>

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
        {success && <p className="mb-4 text-sm text-emerald-600">{success}</p>}

        {parsedData && (
          <div className="border-t border-slate-200 pt-6 mt-6">
            <div className="rounded-lg border border-brand-200 bg-brand-50 p-4">
              <h4 className="font-semibold text-brand-900 mb-2">Parsed Information</h4>
              <div className="space-y-3 text-sm text-brand-800">
                {parsedData.educationMatch && <p><span className="font-medium">Education Match:</span> {parsedData.educationMatch}</p>}
                {parsedData.experienceYears !== undefined && <p><span className="font-medium">Estimated Experience:</span> {parsedData.experienceYears} years</p>}
                
                <div>
                  <span className="font-medium">Extracted Skills:</span>
                  {parsedData.detectedSkills && parsedData.detectedSkills.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {parsedData.detectedSkills.map((skill, i) => (
                        <span key={i} className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-brand-700 border border-brand-200">
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-1 text-xs text-brand-600">No specific skills automatically detected in the PDF text.</p>
                  )}
                </div>
              </div>
              <div className="mt-4 border-t border-brand-200 pt-3">
                <p className="text-xs text-brand-600">
                  Confirm these details in the Skills section. Resume-detected skills can be marked as Self-Declared, but will not receive scores without a formal assessment.
                </p>
              </div>
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

export default StudentResumePage;
