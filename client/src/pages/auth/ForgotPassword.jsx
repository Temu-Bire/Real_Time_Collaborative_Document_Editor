import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Mail,
  Edit3,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Send
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { forgotPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (e) => {
    setEmail(e.target.value);
    if (error) setError(null);
    if (serverError) setServerError('');
  };

  const validate = () => {
    if (!email.trim()) return 'Email address is required';
    if (!/\S+@\S+\.\S+/.test(email)) return 'Please enter a valid email address';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setIsSubmitting(true);
    setServerError('');
    try {
      await forgotPassword(email);
      setIsSuccess(true);
    } catch (err) {
      setServerError(
        err.response?.data?.message || 'Failed to send reset email. Please try again.'
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
          Forgot your password?
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Enter your email and we&apos;ll send you a link to reset your password.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200/80 rounded-2xl sm:px-10">

          {isSuccess ? (
            <div className="text-center py-4">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-emerald-100 mb-4">
                <CheckCircle className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">Check your email</h3>
              <p className="text-sm text-slate-600 mb-6">
                We&apos;ve sent a password reset link to <strong>{email}</strong>.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 border border-slate-300 rounded-lg shadow-sm bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-150"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Return to sign in</span>
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
                      value={email}
                      onChange={handleChange}
                      placeholder="jane@company.com"
                      className={`block w-full pl-10 pr-3 py-2.5 text-sm bg-white border rounded-lg transition-all outline-none ${
                        error
                          ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 text-red-900 placeholder-red-300'
                          : 'border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-slate-900 placeholder-slate-400'
                      }`}
                    />
                  </div>
                  {error && (
                    <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5 inline" /> {error}
                    </p>
                  )}
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
                        <span>Sending link...</span>
                      </>
                    ) : (
                      <>
                        <span>Send Reset Link</span>
                        <Send className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
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