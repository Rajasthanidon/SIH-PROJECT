import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import { useAuth } from '../context/AuthContext';

function LoginPage() {
  const navigate = useNavigate();
  const { login, getDashboardPathForRole } = useAuth();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = await login(form);
      const redirectPath = getDashboardPathForRole(payload?.user?.role);
      navigate(redirectPath, { replace: true });
    } catch (submitError) {
      setError(submitError.message || 'Unable to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-soft">
      <h1 className="text-2xl font-semibold text-slate-900">Sign in</h1>
      <p className="mt-2 text-sm text-slate-500">Use your portal credentials to continue.</p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="username" className="mb-1 block text-sm font-medium text-slate-700">Username</label>
          <input id="username" name="username" type="text" value={form.username} onChange={handleChange} className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-brand-500" placeholder="e.g. student123 or student@nita.ug.ac.in" required />
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">Password</label>
          <input id="password" name="password" type="password" value={form.password} onChange={handleChange} className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-brand-500" placeholder="••••••••" required />
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>

      <div className="mt-4 flex items-center justify-between text-sm">
        <Link to="/forgot-password" className="font-medium text-brand-700">Forgot password?</Link>
        <Link to="/register" className="font-medium text-brand-700">Create account</Link>
      </div>
    </div>
  );
}

export default LoginPage;
