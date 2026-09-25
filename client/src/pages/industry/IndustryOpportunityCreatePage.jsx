import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createOpportunity } from '../../services/opportunitiesApi';
import SectionCard from '../../components/common/SectionCard';

export default function IndustryOpportunityCreatePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [form, setForm] = useState({
    type: 'JOB',
    title: '',
    company_name: '',
    description: '',
    responsibilities: '',
    required_skills: '',
    preferred_qualifications: '',
    location: '',
    work_mode: 'On-site',
    application_deadline: '',
    openings: '',
    salary: '',
    employment_type: 'Full-time',
    internship_duration: '',
    stipend: '',
    ppo_available: false,
    min_cgpa: '',
    allowed_branches: ''
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e, status) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const payload = { ...form, status };
      
      // Parse comma separated lists
      if (payload.required_skills) {
        payload.required_skills = payload.required_skills.split(',').map(s => s.trim()).filter(Boolean);
      } else {
        payload.required_skills = [];
      }
      
      if (payload.allowed_branches) {
        payload.allowed_branches = payload.allowed_branches.split(',').map(s => s.trim()).filter(Boolean);
      } else {
        payload.allowed_branches = [];
      }

      if (payload.openings) payload.openings = parseInt(payload.openings, 10);
      if (payload.min_cgpa) payload.min_cgpa = parseFloat(payload.min_cgpa);
      
      await createOpportunity(payload);
      navigate('/industry/opportunities');
    } catch (err) {
      setError(err.message || 'Failed to create opportunity');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Post New Opportunity</h1>
          <p className="text-sm text-slate-500">Create a job or internship posting for students.</p>
        </div>
      </div>

      {error && <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 border border-red-200">{error}</div>}

      <SectionCard>
        <form className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Opportunity Type *</label>
              <select name="type" value={form.type} onChange={handleChange} required>
                <option value="JOB">Job</option>
                <option value="INTERNSHIP">Internship</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Company Name *</label>
              <input type="text" name="company_name" value={form.company_name} onChange={handleChange} required placeholder="ABC Technologies" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
              <input type="text" name="title" value={form.title} onChange={handleChange} required placeholder="Software Engineer Intern" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Description *</label>
              <textarea name="description" value={form.description} onChange={handleChange} required rows={4} placeholder="About the role..." />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Responsibilities</label>
              <textarea name="responsibilities" value={form.responsibilities} onChange={handleChange} rows={3} />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Location *</label>
              <input type="text" name="location" value={form.location} onChange={handleChange} required placeholder="City, State" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Work Mode *</label>
              <select name="work_mode" value={form.work_mode} onChange={handleChange} required>
                <option value="On-site">On-site</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Remote">Remote</option>
              </select>
            </div>

            {form.type === 'JOB' ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Salary / CTC</label>
                  <input type="text" name="salary" value={form.salary} onChange={handleChange} placeholder="e.g. 12 LPA" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Employment Type</label>
                  <input type="text" name="employment_type" value={form.employment_type} onChange={handleChange} placeholder="Full-time" />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Stipend</label>
                  <input type="text" name="stipend" value={form.stipend} onChange={handleChange} placeholder="e.g. ₹25,000/month" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Duration</label>
                  <input type="text" name="internship_duration" value={form.internship_duration} onChange={handleChange} placeholder="e.g. 6 Months" />
                </div>
                <div className="md:col-span-2 flex items-center gap-2">
                  <input type="checkbox" name="ppo_available" checked={form.ppo_available} onChange={handleChange} className="w-4 h-4" />
                  <label className="text-sm font-medium text-slate-700">Pre-Placement Offer (PPO) Available</label>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Application Deadline</label>
              <input type="date" name="application_deadline" value={form.application_deadline} onChange={handleChange} />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Number of Openings</label>
              <input type="number" name="openings" value={form.openings} onChange={handleChange} placeholder="Optional" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Required Skills (Comma separated)</label>
              <input type="text" name="required_skills" value={form.required_skills} onChange={handleChange} placeholder="React, Node.js, Python" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Minimum CGPA</label>
              <input type="number" step="0.1" name="min_cgpa" value={form.min_cgpa} onChange={handleChange} placeholder="e.g. 7.5" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Allowed Branches (Comma separated)</label>
              <input type="text" name="allowed_branches" value={form.allowed_branches} onChange={handleChange} placeholder="CSE, ECE" />
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
            <button 
              type="button" 
              onClick={() => navigate('/industry/opportunities')} 
              className="ghost-button"
            >
              Cancel
            </button>
            <button 
              type="button" 
              onClick={(e) => handleSubmit(e, 'DRAFT')}
              disabled={loading}
              className="ghost-button"
            >
              Save as Draft
            </button>
            <button 
              type="button" 
              onClick={(e) => handleSubmit(e, 'PUBLISHED')}
              disabled={loading}
              className="primary-button"
            >
              {loading ? 'Publishing...' : 'Publish Opportunity'}
            </button>
          </div>
        </form>
      </SectionCard>
    </div>
  );
}
