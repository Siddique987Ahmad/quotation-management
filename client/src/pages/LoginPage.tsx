import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../services/api';
import { 
  handleLoginSuccess, 
  validateLoginCredentials, 
  isAuthenticated,
  setUserPermissions // ADD THIS
} from '../utils/auth';
import { useCompany } from '../contexts/CompanyContext';
import { LoginCredentials, ApiResponse, AuthResponse } from '../types';
import LoadingSpinner, { ButtonSpinner } from '../components/LoadingSpinner';

// =============================================================================
// TYPES
// =============================================================================

interface LoginFormState {
  email: string;
  password: string;
}

interface LoginPageState {
  form: LoginFormState;
  isLoading: boolean;
  error: string | null;
  validationErrors: string[];
  showPassword: boolean;
}

// =============================================================================
// COMPANY LOGO COMPONENT FOR LOGIN
// =============================================================================

const LoginCompanyLogo: React.FC<{ className?: string }> = ({ className = "w-16 h-16" }) => {
  const { companySettings, loading } = useCompany();

  if (loading) {
    return (
      <div className={`bg-gray-200 rounded-xl animate-pulse ${className}`} />
    );
  }

  const logoUrl = companySettings?.logo
    ? `${process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000'}${companySettings.logo}?t=${Date.now()}`
    : null;

  const companyName = companySettings?.name || 'QuoteFlow';
  const initials = companyName
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={`rounded-xl flex items-center justify-center overflow-hidden shadow-lg ${className}`}>
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={`${companyName} Logo`}
          className="w-full h-full object-contain bg-white"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent && !parent.querySelector('.logo-fallback')) {
              const fallback = document.createElement('div');
              fallback.className = 'logo-fallback w-full h-full bg-blue-600 flex items-center justify-center';
              fallback.innerHTML = `<span class="text-white font-bold text-2xl">${initials}</span>`;
              parent.appendChild(fallback);
            }
          }}
        />
      ) : (
        <div className="w-full h-full bg-blue-600 flex items-center justify-center">
          <span className="text-white font-bold text-2xl">{initials}</span>
        </div>
      )}
    </div>
  );
};

// =============================================================================
// COMPONENT
// =============================================================================

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { companySettings } = useCompany();
  const redirectTo = searchParams.get('redirect') || '/dashboard';
  const reason = searchParams.get('reason');

  const [state, setState] = useState<LoginPageState>({
    form: {
      email: '',
      password: ''
    },
    isLoading: false,
    error: null,
    validationErrors: [],
    showPassword: false
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated()) {
      navigate(redirectTo);
    }
  }, [navigate, redirectTo]);

  // Show session expired message
  useEffect(() => {
    if (reason === 'session_expired') {
      setState(prev => ({
        ...prev,
        error: 'Your session has expired. Please login again.'
      }));
    }
  }, [reason]);

  // Handle input changes
  const handleInputChange = (field: keyof LoginFormState) => (
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
  const togglePasswordVisibility = () => {
    setState(prev => ({
      ...prev,
      showPassword: !prev.showPassword
    }));
  };

  // Handle form submission - UPDATED WITH PERMISSION FETCHING
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (state.isLoading) {
      return;
    }

    setState(prev => ({
      ...prev,
      error: null,
      validationErrors: [],
      isLoading: true
    }));

    // Validate form
    const validationErrors = validateLoginCredentials(state.form);
    if (validationErrors.length > 0) {
      setState(prev => ({
        ...prev,
        validationErrors,
        isLoading: false
      }));
      return;
    }

    try {
      // 1. Login
      const response = await authAPI.login(state.form.email, state.form.password);
      
      if (response.data.success && response.data.data) {
        // 2. Store auth data (token + user)
        handleLoginSuccess(response.data.data as AuthResponse);
        
        // 3. Fetch and store permissions from database
        try {
          console.log('Fetching user permissions...');
          const permissionsResponse = await authAPI.getMyPermissions();
          
          if (permissionsResponse.data.success) {
            const allPermissions = permissionsResponse.data.data.allPermissions;
            console.log('Permissions loaded:', allPermissions);
            setUserPermissions(allPermissions);
          }
        } catch (permError) {
          console.error('Failed to load permissions:', permError);
          // Continue anyway - user can still login, permissions will use fallback
        }
        
        // 4. Navigate to dashboard
        navigate(redirectTo);
      } else {
        setState(prev => ({
          ...prev,
          error: response.data.message || 'Login failed',
          isLoading: false
        }));
      }
    } catch (error: any) {
      console.error('Login error:', error);
      
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 401) {
        errorMessage = 'Invalid email or password';
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

  const companyName = companySettings?.name || 'QuoteFlow';

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <LoginCompanyLogo className="w-16 h-16" />
        </div>
        <h1 className="mt-6 text-center text-3xl font-bold text-gray-900">
          Welcome to {companyName}
        </h1>
        <p className="mt-2 text-center text-sm text-gray-600">
          Sign in to your account to continue
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

          {state.validationErrors.length > 0 && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              <ul className="list-disc list-inside space-y-1">
                {state.validationErrors.map((error, index) => (
                  <li key={index} className="text-sm">{error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Login form */}
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {/* Email field */}
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
                  value={state.form.email}
                  onChange={handleInputChange('email')}
                  disabled={state.isLoading}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Enter your email address"
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={state.showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={state.form.password}
                  onChange={handleInputChange('password')}
                  disabled={state.isLoading}
                  className="appearance-none block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  disabled={state.isLoading}
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

            {/* Remember me and forgot password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link
                  to="/forgot-password"
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Forgot your password?
                </Link>
              </div>
            </div>

            {/* Submit button */}
            <div>
              <button
                type="submit"
                disabled={state.isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {state.isLoading && <ButtonSpinner />}
                {state.isLoading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              {companyName} v1.0.0 - Quotation Management System
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;