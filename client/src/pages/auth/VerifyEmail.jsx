import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  MailCheck,
  Edit3,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function VerifyEmail() {
  const location = useLocation();
  const { resendVerification } = useAuth();

  // Email is passed via router state from the Register page
  const userEmail = location.state?.email || '';

  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState(null);
  const [countdown, setCountdown] = useState(0);

  // Countdown timer for resend cooldown
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleResendEmail = async () => {
    if (countdown > 0 || isResending) return;

    setIsResending(true);
    setResendError(null);
    setResendSuccess(false);

    try {
      await resendVerification(userEmail);
      setResendSuccess(true);
      setCountdown(60);
    } catch (err) {
      setResendError(
        err.response?.data?.message || 'Failed to resend verification email. Please try again.'
      );
    } finally {
      setIsResending(false);
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
          Verify your email
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          We&apos;ve sent a verification link to your email address to activate your SyncWrite account.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200/80 rounded-2xl sm:px-10 text-center">

          {/* Email Graphic Badge */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-indigo-50 border border-indigo-100 mb-6 text-indigo-600">
            <MailCheck className="h-8 w-8" />
          </div>

          {/* Dynamic Email Box */}
          {userEmail && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 mb-6">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">
                Sent to
              </p>
              <p className="text-sm font-semibold text-slate-900 break-all">
                {userEmail}
              </p>
            </div>
          )}

          {/* Status Banners */}
          {resendSuccess && (
            <div className="mb-6 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 justify-center">
              <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              <span>A new verification email has been sent!</span>
            </div>
          )}

          {resendError && (
            <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2 justify-center">
              <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
              <span>{resendError}</span>
            </div>
          )}

          <p className="text-sm text-slate-600 mb-6 leading-relaxed">
            Click on the link in the email to confirm your address. If you don&apos;t see it, check your spam folder.
          </p>

          {/* Resend Button */}
          <div className="space-y-4">
            <button
              type="button"
              onClick={handleResendEmail}
              disabled={isResending || countdown > 0}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-slate-300 rounded-lg shadow-sm bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-150"
            >
              {isResending ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-slate-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Sending email...</span>
                </>
              ) : countdown > 0 ? (
                <>
                  <RefreshCw className="h-4 w-4 text-slate-400" />
                  <span>Resend email in {countdown}s</span>
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  <span>Resend verification email</span>
                </>
              )}
            </button>
          </div>

          {/* Back to Sign In */}
          <div className="mt-6 border-t border-slate-100 pt-5 flex justify-center">
            <Link
              to="/login"
              className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to sign in</span>
            </Link>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-slate-400 flex items-center justify-center gap-1.5">
            <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
            Instant delivery &amp; 24/7 account support
          </p>
        </div>
      </div>
    </div>
  );
}