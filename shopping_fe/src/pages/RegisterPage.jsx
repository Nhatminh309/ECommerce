import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Alert from '../components/Alert.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getApiErrorMessage } from '../services/api';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({ username: '', password: '', confirmPassword: '' });
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

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSubmitting(true);

    try {
      await register(form);
      navigate('/products', { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mx-auto max-w-md">
      <h1 className="text-3xl font-semibold">Register</h1>
      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <Alert>{error}</Alert>

        <label className="field-label" htmlFor="username">
          Username
          <input
            id="username"
            className="field-input"
            name="username"
            value={form.username}
            minLength={3}
            maxLength={50}
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
            minLength={6}
            onChange={handleChange}
            required
          />
        </label>

        <label className="field-label" htmlFor="confirmPassword">
          Confirm password
          <input
            id="confirmPassword"
            className="field-input"
            name="confirmPassword"
            type="password"
            value={form.confirmPassword}
            onChange={handleChange}
            required
          />
        </label>

        <button className="btn-primary w-full" type="submit" disabled={submitting}>
          {submitting ? 'Creating account...' : 'Register'}
        </button>
      </form>

      <p className="mt-4 text-sm text-slate-600">
        Already registered?{' '}
        <Link className="font-medium text-leaf hover:underline" to="/login">
          Login
        </Link>
      </p>
    </section>
  );
}
