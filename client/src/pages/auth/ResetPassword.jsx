import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Lock,
  Eye,
  EyeOff,
  Edit3,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { resetPassword } = useAuth();

  // Token comes from the reset link: /reset-password?token=xxx
  const token = searchParams.get('token') || '';

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // If no token is in the URL, warn the user
  const [tokenMissing, setTokenMissing] = useState(false);
  useEffect(() => {
    if (!token) setTokenMissing(true);
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    if (serverError) setServerError('');
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.password) {
      newErrors.password = 'New password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (formData.confirmPassword !== formData.password) {
      newErrors.confirmPassword = 'Passwords do not match';
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
      await resetPassword(token, formData.password);
      setIsSuccess(true);
      // Auto-redirect to login after 3 seconds
      setTimeout(() => navigate('/login', { state: { message: 'Password reset successful. Please sign in.' } }), 3000);
    } catch (err) {
      setServerError(
        err.response?.data?.message || 'Failed to reset password. The link may have expired.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

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
          Reset your password
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Enter a new password for your SyncWrite account.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200/80 rounded-2xl sm:px-10">

          {/* Missing / invalid token */}
          {tokenMissing && (
            <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <span>
                Invalid or missing reset token. Please request a new{' '}
                <Link to="/forgot-password" className="underline font-semibold">
                  password reset link
                </Link>.
              </span>
            </div>
          )}

          {isSuccess ? (
            <div className="text-center py-4">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-emerald-100 mb-4">
                <CheckCircle className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">Password updated!</h3>
              <p className="text-sm text-slate-600 mb-6">
                Your password has been reset. Redirecting you to sign in&hellip;
              </p>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 border border-transparent rounded-lg shadow-sm bg-indigo-600 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-150"
              >
                Sign In Now
              </Link>
            </div>
          ) : (
            <>
              {/* Server error */}
              {serverError && (
                <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <span>{serverError}</span>
                </div>
              )}

              <form className="space-y-5" onSubmit={handleSubmit} noValidate>
                {/* New Password */}
                <div>
                  <label htmlFor="password" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Minimum 8 characters"
                      disabled={tokenMissing}
                      className={`block w-full pl-10 pr-10 py-2.5 text-sm bg-white border rounded-lg outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                        errors.password
                          ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                          : 'border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" /> {errors.password}
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Re-enter your new password"
                      disabled={tokenMissing}
                      className={`block w-full pl-10 pr-10 py-2.5 text-sm bg-white border rounded-lg outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                        errors.confirmPassword
                          ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                          : 'border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((p) => !p)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                      aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" /> {errors.confirmPassword}
                    </p>
                  )}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isSubmitting || tokenMissing}
                  className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-150"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span>Resetting password...</span>
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </button>
              </form>

              {/* Back to sign in */}
              <div className="mt-6 flex justify-center">
                <Link
                  to="/login"
                  className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to sign in</span>
                </Link>
              </div>
            </>
          )}
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-slate-400 flex items-center justify-center gap-1.5">
            <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
            Secure password recovery process
          </p>
        </div>
      </div>
    </div>
  );
}