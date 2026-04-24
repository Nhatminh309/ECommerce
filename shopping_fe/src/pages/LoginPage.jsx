import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Alert from '../components/Alert.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getApiErrorMessage } from '../services/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await login(form);
      navigate(location.state?.from?.pathname || '/products', { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mx-auto max-w-md">
      <h1 className="text-3xl font-semibold">Login</h1>
      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <Alert>{error}</Alert>

        <label className="field-label" htmlFor="username">
          Username
          <input
            id="username"
            className="field-input"
            name="username"
            value={form.username}
            onChange={handleChange}
            required
          />
        </label>

        <label className="field-label" htmlFor="password">
          Password
          <input
            id="password"
            className="field-input"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            required
          />
        </label>

        <button className="btn-primary w-full" type="submit" disabled={submitting}>
          {submitting ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <p className="mt-4 text-sm text-slate-600">
        Need an account?{' '}
        <Link className="font-medium text-leaf hover:underline" to="/register">
          Register
        </Link>
      </p>
    </section>
  );
}
