import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../services/api';
import { isValidEmail, isValidPassword } from '../utils/auth';
import { ButtonSpinner } from '../components/LoadingSpinner';

// =============================================================================
// TYPES
// =============================================================================

interface ForgotPasswordFormState {
  email: string;
}

interface ResetPasswordFormState {
  newPassword: string;
  confirmPassword: string;
}

interface PageState {
  mode: 'forgot' | 'reset';
  form: ForgotPasswordFormState | ResetPasswordFormState;
  isLoading: boolean;
  error: string | null;
  success: string | null;
  validationErrors: string[];
  showPassword: boolean;
  showConfirmPassword: boolean;
}

// =============================================================================
// COMPONENT
// =============================================================================

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [state, setState] = useState<PageState>({
    mode: token ? 'reset' : 'forgot',
    form: token 
      ? { newPassword: '', confirmPassword: '' } as ResetPasswordFormState
      : { email: '' } as ForgotPasswordFormState,
    isLoading: false,
    error: null,
    success: null,
    validationErrors: [],
    showPassword: false,
    showConfirmPassword: false
  });

  // Validate token on mount
  useEffect(() => {
    if (token && token.length < 10) {
      setState(prev => ({
        ...prev,
        error: 'Invalid reset token. Please request a new password reset.',
        mode: 'forgot',
        form: { email: '' }
      }));
    }
  }, [token]);

  // Handle input changes
  const handleInputChange = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setState(prev => ({
      ...prev,
      form: {
        ...prev.form,
        [field]: e.target.value
      },
      error: null,
      validationErrors: []
    }));
  };

  // Toggle password visibility
  const togglePasswordVisibility = (field: 'password' | 'confirmPassword') => {
    setState(prev => ({
      ...prev,
      [field === 'password' ? 'showPassword' : 'showConfirmPassword']: 
        !prev[field === 'password' ? 'showPassword' : 'showConfirmPassword']
    }));
  };

  // Validate forgot password form
  const validateForgotPasswordForm = (form: ForgotPasswordFormState): string[] => {
    const errors: string[] = [];
    
    if (!form.email) {
      errors.push('Email address is required');
    } else if (!isValidEmail(form.email)) {
      errors.push('Please enter a valid email address');
    }
    
    return errors;
  };

  // Validate reset password form
  const validateResetPasswordForm = (form: ResetPasswordFormState): string[] => {
    const errors: string[] = [];
    
    if (!form.newPassword) {
      errors.push('New password is required');
    } else if (!isValidPassword(form.newPassword)) {
      errors.push('Password must be at least 6 characters long');
    }
    
    if (!form.confirmPassword) {
      errors.push('Please confirm your password');
    } else if (form.newPassword !== form.confirmPassword) {
      errors.push('Passwords do not match');
    }
    
    return errors;
  };

  // Handle forgot password submission
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const form = state.form as ForgotPasswordFormState;
    
    // Reset state
    setState(prev => ({
      ...prev,
      error: null,
      validationErrors: [],
      isLoading: true
    }));

    // Validate form
    const validationErrors = validateForgotPasswordForm(form);
    if (validationErrors.length > 0) {
      setState(prev => ({
        ...prev,
        validationErrors,
        isLoading: false
      }));
      return;
    }

    try {
      const response = await authAPI.forgotPassword(form.email);
      
      if (response.data.success) {
        setState(prev => ({
          ...prev,
          success: 'Password reset instructions have been sent to your email address.',
          isLoading: false
        }));
      } else {
        setState(prev => ({
          ...prev,
          error: response.data.message || 'Failed to send reset email',
          isLoading: false
        }));
      }
    } catch (error: any) {
      let errorMessage = 'Failed to send reset email. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 404) {
        errorMessage = 'No account found with this email address';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      }

      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false
      }));
    }
  };

  // Handle reset password submission
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const form = state.form as ResetPasswordFormState;
    
    // Reset state
    setState(prev => ({
      ...prev,
      error: null,
      validationErrors: [],
      isLoading: true
    }));

    // Validate form
    const validationErrors = validateResetPasswordForm(form);
    if (validationErrors.length > 0) {
      setState(prev => ({
        ...prev,
        validationErrors,
        isLoading: false
      }));
      return;
    }

    try {
      const response = await authAPI.resetPassword({
        token: token!,
        newPassword: form.newPassword
      });
      
      if (response.data.success) {
        setState(prev => ({
          ...prev,
          success: 'Your password has been reset successfully. You can now login with your new password.',
          isLoading: false
        }));
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login?message=password_reset_success');
        }, 3000);
      } else {
        setState(prev => ({
          ...prev,
          error: response.data.message || 'Failed to reset password',
          isLoading: false
        }));
      }
    } catch (error: any) {
      let errorMessage = 'Failed to reset password. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 400) {
        errorMessage = 'Invalid or expired reset token. Please request a new password reset.';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      }

      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false
      }));
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo and branding */}
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-2xl">QF</span>
          </div>
        </div>
        <h1 className="mt-6 text-center text-3xl font-bold text-gray-900">
          {state.mode === 'forgot' ? 'Forgot Password' : 'Reset Password'}
        </h1>
        <p className="mt-2 text-center text-sm text-gray-600">
          {state.mode === 'forgot' 
            ? 'Enter your email address and we\'ll send you a link to reset your password'
            : 'Enter your new password below'
          }
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10 border border-gray-200">
          {/* Alert messages */}
          {state.error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm">{state.error}</p>
                </div>
              </div>
            </div>
          )}

          {state.success && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm">{state.success}</p>
                </div>
              </div>
            </div>
          )}

          {state.validationErrors.length > 0 && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              <ul className="list-disc list-inside space-y-1">
                {state.validationErrors.map((error, index) => (
                  <li key={index} className="text-sm">{error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Form content */}
          {state.mode === 'forgot' ? (
            // Forgot Password Form
            <form onSubmit={handleForgotPasswordSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={(state.form as ForgotPasswordFormState).email}
                    onChange={handleInputChange('email')}
                    disabled={state.isLoading || Boolean(state.success)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="Enter your email address"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={state.isLoading || Boolean(state.success)}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {state.isLoading && <ButtonSpinner />}
                  {state.isLoading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </div>
            </form>
          ) : (
            // Reset Password Form
            <form onSubmit={handleResetPasswordSubmit} className="space-y-6">
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                  New Password
                </label>
                <div className="mt-1 relative">
                  <input
                    id="newPassword"
                    name="newPassword"
                    type={state.showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={(state.form as ResetPasswordFormState).newPassword}
                    onChange={handleInputChange('newPassword')}
                    disabled={state.isLoading || Boolean(state.success)}
                    className="appearance-none block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="Enter your new password"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('password')}
                    disabled={state.isLoading || Boolean(state.success)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
                  >
                    {state.showPassword ? (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm New Password
                </label>
                <div className="mt-1 relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={state.showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={(state.form as ResetPasswordFormState).confirmPassword}
                    onChange={handleInputChange('confirmPassword')}
                    disabled={state.isLoading || Boolean(state.success)}
                    className="appearance-none block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="Confirm your new password"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('confirmPassword')}
                    disabled={state.isLoading || Boolean(state.success)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
                  >
                    {state.showConfirmPassword ? (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Password requirements */}
              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                <p className="font-medium mb-2">Password requirements:</p>
                <ul className="space-y-1 text-xs">
                  <li className="flex items-center">
                    <svg className="h-3 w-3 text-gray-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    At least 6 characters long
                  </li>
                  <li className="flex items-center">
                    <svg className="h-3 w-3 text-gray-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Mix of letters, numbers, and symbols recommended
                  </li>
                </ul>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={state.isLoading || Boolean(state.success)}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {state.isLoading && <ButtonSpinner />}
                  {state.isLoading ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </form>
          )}

          {/* Navigation links */}
          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="text-sm text-blue-600 hover:text-blue-500 font-medium"
            >
              Back to Login
            </Link>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              QuoteFlow v1.0.0 - Quotation Management System
            </p>
          </div>
        </div>
      </div>

      {/* Help text */}
      <div className="mt-8 text-center">
        <div className="max-w-md mx-auto">
          {state.mode === 'forgot' ? (
            <div className="text-sm text-gray-600">
              <h3 className="font-medium mb-2">Need help?</h3>
              <ul className="space-y-1 text-xs">
                <li>• Make sure to check your spam/junk folder</li>
                <li>• The reset link will expire in 1 hour</li>
                <li>• Contact your system administrator if you continue having issues</li>
              </ul>
            </div>
          ) : (
            <div className="text-sm text-gray-600">
              <h3 className="font-medium mb-2">Security Tips</h3>
              <ul className="space-y-1 text-xs">
                <li>• Use a strong, unique password</li>
                <li>• Don't share your password with others</li>
                <li>• Consider using a password manager</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;