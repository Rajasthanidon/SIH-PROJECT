import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import { useAuth } from '../context/AuthContext';

function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [role, setRole] = useState('student');
  const [form, setForm] = useState({
    name: '', email: '', username: '', password: '', confirmPassword: '',
    enrollmentNumber: '', registrationNumber: '', department: '',
    designation: '', companyName: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    setError('');
    // Clear role specific fields
    setForm({
      name: '', email: '', username: '', password: '', confirmPassword: '',
      enrollmentNumber: '', registrationNumber: '', department: '',
      designation: '', companyName: ''
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      setLoading(false);
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    if (role === 'student' && !form.email.endsWith('@nita.ug.ac.in')) {
      setError('Only @nita.ug.ac.in email addresses are allowed for student registration.');
      setLoading(false);
      return;
    }

    try {
      await register({ ...form, role });
      navigate('/login');
    } catch (submitError) {
      setError(submitError.message || 'Unable to create your account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-soft">
      <h1 className="text-2xl font-semibold text-slate-900">Create account</h1>
      <p className="mt-2 text-sm text-slate-500">Select your account type to register.</p>

      <div className="mt-6 flex border-b border-slate-200 overflow-x-auto no-scrollbar">
        {['student', 'faculty', 'industry', 'placement'].map((r) => (
          <button
            key={r}
            type="button"
            className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap ${
              role === r ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
            onClick={() => handleRoleChange(r)}
          >
            {r === 'student' ? 'Student' : 
             r === 'faculty' ? 'Faculty' : 
             r === 'industry' ? 'Industry' : 'Placement Cell'}
          </button>
        ))}
      </div>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        {role === 'student' && (
          <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-800 mb-4 border border-blue-100">
            <strong>Note:</strong> Use your official NIT Agartala institutional email (@nita.ug.ac.in).
          </div>
        )}
        
        {role === 'industry' && (
          <div className="bg-amber-50 p-3 rounded-md text-sm text-amber-800 mb-4 border border-amber-100">
            <strong>Note:</strong> Industry accounts are subject to administrative review.
          </div>
        )}

        {role === 'placement' && (
          <div className="bg-rose-50 p-3 rounded-md text-sm text-rose-800 mb-4 border border-rose-100">
            <strong>Note:</strong> Placement Cell accounts require strict administrative approval before activation.
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className={role !== 'student' ? "col-span-2" : "col-span-2"}>
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-slate-700">Full name</label>
            <input id="name" name="name" type="text" value={form.name} onChange={handleChange} className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-brand-500" required />
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">Official Email</label>
            <input id="email" name="email" type="email" value={form.email} onChange={handleChange} className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-brand-500" required />
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label htmlFor="username" className="mb-1 block text-sm font-medium text-slate-700">Username</label>
            <input id="username" name="username" type="text" value={form.username} onChange={handleChange} className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-brand-500" required />
          </div>

          {role === 'student' && (
            <>
              <div className="col-span-2 sm:col-span-1">
                <label htmlFor="enrollmentNumber" className="mb-1 block text-sm font-medium text-slate-700">Enrollment Number</label>
                <input id="enrollmentNumber" name="enrollmentNumber" type="text" value={form.enrollmentNumber} onChange={handleChange} className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-brand-500" required />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label htmlFor="registrationNumber" className="mb-1 block text-sm font-medium text-slate-700">Registration Number</label>
                <input id="registrationNumber" name="registrationNumber" type="text" value={form.registrationNumber} onChange={handleChange} className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-brand-500" required />
              </div>
              <div className="col-span-2">
                <label htmlFor="department" className="mb-1 block text-sm font-medium text-slate-700">Branch / Department</label>
                <input id="department" name="department" type="text" value={form.department} onChange={handleChange} className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-brand-500" required />
              </div>
            </>
          )}

          {role === 'faculty' && (
            <>
              <div className="col-span-2 sm:col-span-1">
                <label htmlFor="department" className="mb-1 block text-sm font-medium text-slate-700">Department</label>
                <input id="department" name="department" type="text" value={form.department} onChange={handleChange} className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-brand-500" required />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label htmlFor="designation" className="mb-1 block text-sm font-medium text-slate-700">Designation</label>
                <input id="designation" name="designation" type="text" value={form.designation} onChange={handleChange} className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-brand-500" required />
              </div>
            </>
          )}

          {role === 'industry' && (
            <>
              <div className="col-span-2 sm:col-span-1">
                <label htmlFor="companyName" className="mb-1 block text-sm font-medium text-slate-700">Company Name</label>
                <input id="companyName" name="companyName" type="text" value={form.companyName} onChange={handleChange} className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-brand-500" required />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label htmlFor="designation" className="mb-1 block text-sm font-medium text-slate-700">Your Designation</label>
                <input id="designation" name="designation" type="text" value={form.designation} onChange={handleChange} className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-brand-500" required />
              </div>
            </>
          )}

          {role === 'placement' && (
            <div className="col-span-2">
              <label htmlFor="designation" className="mb-1 block text-sm font-medium text-slate-700">Official Designation</label>
              <input id="designation" name="designation" type="text" value={form.designation} onChange={handleChange} className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-brand-500" required />
            </div>
          )}

          <div className="col-span-2 sm:col-span-1">
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">Password</label>
            <input id="password" name="password" type="password" value={form.password} onChange={handleChange} className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-brand-500" required />
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-slate-700">Confirm Password</label>
            <input id="confirmPassword" name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-brand-500" required />
          </div>
        </div>

        {error ? <p className="text-sm text-red-600 font-medium">{error}</p> : null}

        <Button type="submit" className="w-full mt-4" disabled={loading}>
          {loading ? 'Creating account...' : `Create ${role === 'student' ? 'Student' : role === 'faculty' ? 'Faculty' : role === 'industry' ? 'Industry' : 'Placement Cell'} account`}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-slate-600">
        Already have an account? <Link to="/login" className="font-medium text-brand-700 hover:underline">Sign in</Link>
      </p>
    </div>
  );
}

export default RegisterPage;
