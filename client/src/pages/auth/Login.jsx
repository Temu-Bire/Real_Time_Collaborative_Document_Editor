import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Edit3,
  ArrowRight,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, googleLogin } = useAuth();

  // Redirect back to where the user came from, or dashboard
  const from = location.state?.from?.pathname || '/dashboard';
  const successMessage = location.state?.message || null;

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
    if (serverError) setServerError('');
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setIsSubmitting(true);
    setServerError('');
    try {
      await login({ email: formData.email, password: formData.password });
      navigate(from, { replace: true });
    } catch (error) {
      setServerError(
        error.response?.data?.message || 'Sign in failed. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsSubmitting(true);
      setServerError('');
      try {
        // tokenResponse.access_token — we pass it as the idToken;
        // the server verifies it with Google's tokeninfo endpoint.
        await googleLogin(tokenResponse.access_token);
        navigate(from, { replace: true });
      } catch (err) {
        setServerError(
          err.response?.data?.message || 'Google sign-in failed. Please try again.'
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    onError: () => {
      setServerError('Google sign-in was cancelled or failed. Please try again.');
    },
    flow: 'implicit',
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-800 font-sans antialiased">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand */}
        <div className="flex items-center justify-center gap-2.5 mb-2">
          <div className="bg-indigo-600 p-2.5 rounded-xl shadow-sm text-white flex items-center justify-center">
            <Edit3 className="h-6 w-6" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-slate-900">
            Sync<span className="text-indigo-600">Write</span>
          </span>
        </div>

        <h2 className="mt-4 text-center text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Welcome back
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Sign in to access your collaborative documents and workspaces.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200/80 rounded-2xl sm:px-10">

          {/* Success message from register / reset flow */}
          {successMessage && (
            <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 flex items-start gap-2">
              <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Server error */}
          {serverError && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Google */}
          <button
            type="button"
            onClick={() => handleGoogleSignIn()}
            disabled={isSubmitting}
            className="w-full flex justify-center items-center gap-3 py-2.5 px-4 border border-slate-300 rounded-lg shadow-sm bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-300 disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-150"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-slate-400 font-medium tracking-wider">
                Or sign in with email
              </span>
            </div>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Work Email Address
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="jane@company.com"
                  className={`block w-full pl-10 pr-3 py-2.5 text-sm bg-white border rounded-lg transition-all outline-none ${
                    errors.email
                      ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 text-red-900 placeholder-red-300'
                      : 'border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5 inline" /> {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className={`block w-full pl-10 pr-10 py-2.5 text-sm bg-white border rounded-lg transition-all outline-none ${
                    errors.password
                      ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 text-red-900 placeholder-red-300'
                      : 'border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-slate-900 placeholder-slate-400'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5 inline" /> {errors.password}
                </p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="rememberMe"
                  name="rememberMe"
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer"
                />
                <label htmlFor="rememberMe" className="ml-2 block text-xs font-medium text-slate-700 cursor-pointer">
                  Remember me
                </label>
              </div>
              <div className="text-xs">
                <Link
                  to="/forgot-password"
                  className="font-semibold text-indigo-600 hover:text-indigo-500 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            {/* Submit */}
            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-150"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Footer Link */}
          <div className="mt-6 border-t border-slate-100 pt-5 text-center">
            <p className="text-sm text-slate-600">
              Don&apos;t have an account?{' '}
              <Link
                to="/register"
                className="font-semibold text-indigo-600 hover:text-indigo-500 hover:underline"
              >
                Create one
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-slate-400 flex items-center justify-center gap-1.5">
            <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
            256-bit SSL encrypted &amp; GDPR compliant
          </p>
        </div>
      </div>
    </div>
  );
}