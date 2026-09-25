import { Link } from 'react-router-dom';
import Button from '../components/common/Button';

function ForgotPasswordPage() {
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-soft">
      <h1 className="text-2xl font-semibold text-slate-900">Forgot password</h1>
      <p className="mt-2 text-sm text-slate-500">This is a placeholder reset flow for the authentication foundation.</p>

      <form className="mt-6 space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">Email</label>
          <input id="email" type="email" className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-brand-500" placeholder="name@college.edu" />
        </div>

        <Button type="submit" className="w-full">Send reset link</Button>
      </form>

      <p className="mt-4 text-center text-sm text-slate-600">
        Remembered your password? <Link to="/login" className="font-medium text-brand-700">Back to login</Link>
      </p>
    </div>
  );
}

export default ForgotPasswordPage;
