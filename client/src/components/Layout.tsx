import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, Navigate } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import LoadingSpinner, { PageSpinner } from './LoadingSpinner';
import { isAuthenticated, initializeAuth, cleanupAuth } from '../utils/auth';
import { useCompany } from '../contexts/CompanyContext';


// =============================================================================
// TYPES
// =============================================================================

interface LayoutProps {
  children?: React.ReactNode;
  requireAuth?: boolean;
  className?: string;
}

interface LayoutState {
  sidebarOpen: boolean;
  isLoading: boolean;
  authChecked: boolean;
}

// =============================================================================
// MAIN LAYOUT COMPONENT
// =============================================================================

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  requireAuth = true, 
  className = '' 
}) => {
  const location = useLocation();
  const [state, setState] = useState<LayoutState>({
    sidebarOpen: false,
    isLoading: true,
    authChecked: false
  });

  // Initialize authentication and check user state
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        // Initialize auth with session management
        initializeAuth({
          autoLogoutTime: 30 * 60 * 1000, // 30 minutes
          warningTime: 5 * 60 * 1000, // 5 minutes warning
          onSessionWarning: () => {
            // Show session warning toast/modal
            console.log('Session expiring soon...');
          },
          onSessionExpired: () => {
            // Redirect to login
            window.location.href = '/login?reason=session_expired';
          }
        });

        // Simulate brief loading time for better UX
        await new Promise(resolve => setTimeout(resolve, 500));

        if (mounted) {
          setState(prev => ({
            ...prev,
            isLoading: false,
            authChecked: true
          }));
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setState(prev => ({
            ...prev,
            isLoading: false,
            authChecked: true
          }));
        }
      }
    };

    initAuth();

    // Cleanup function
    return () => {
      mounted = false;
      cleanupAuth();
    };
  }, []);

  // Handle sidebar toggle
  const toggleSidebar = () => {
    setState(prev => ({
      ...prev,
      sidebarOpen: !prev.sidebarOpen
    }));
  };

  // Close sidebar (for mobile)
  const closeSidebar = () => {
    setState(prev => ({
      ...prev,
      sidebarOpen: false
    }));
  };

  // Auto-close sidebar on route change (mobile)
  useEffect(() => {
    closeSidebar();
  }, [location.pathname]);

  // Auto-close sidebar on window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) { // lg breakpoint
        setState(prev => ({
          ...prev,
          sidebarOpen: false
        }));
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Show loading spinner during auth check
  if (state.isLoading || !state.authChecked) {
    return <PageSpinner text="Loading application..." />;
  }

  // Check authentication requirement
  if (requireAuth && !isAuthenticated()) {
    // Preserve the intended destination
    const redirectTo = `/login?redirect=${encodeURIComponent(location.pathname + location.search)}`;
    return <Navigate to={redirectTo} replace />;
  }

  return (
  <div className={`min-h-screen bg-gray-50 ${className}`}>
    {/* Sidebar */}
    <Sidebar 
      isOpen={state.sidebarOpen} 
      onClose={closeSidebar}
      className="print:hidden" 
    />

    {/* Main content wrapper - Simple padding approach */}
    <div className="lg:ml-64">
      {/* Header */}
      <Header 
        onToggleSidebar={toggleSidebar}
        className="print:hidden sticky top-0 z-10"
      />

      {/* Main content */}
      <main className="min-h-screen">
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          {children || <Outlet />}
        </div>
      </main>

      {/* Footer */}
      <footer className="print:hidden bg-white border-t border-gray-200 px-4 py-3">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
            {/* <div className="mb-2 md:mb-0">
              <p>&copy; 2024 QuoteFlow. All rights reserved.</p>
            </div> */}
            {/* <div className="flex space-x-4">
              <a href="#" className="hover:text-gray-700 transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-gray-700 transition-colors">
                Terms of Service
              </a>
              <a href="#" className="hover:text-gray-700 transition-colors">
                Support
              </a>
            </div> */}
          </div>
        </div>
      </footer>
    </div>
  </div>
);
};


// =============================================================================
// SPECIALIZED LAYOUT VARIANTS
// =============================================================================

const CompanyLogo: React.FC<{ className?: string; showText?: boolean }> = ({
  className = "w-12 h-12",
  showText = true
}) => {
  const { companySettings, loading } = useCompany();

  if (loading) {
    return (
      <div className={`bg-gray-200 rounded-lg animate-pulse ${className}`} />
    );
  }

  const logoUrl = companySettings?.logo 
  ? `${process.env.REACT_APP_API_URL || 'http://148.230.82.188:5000'}${companySettings.logo}?t=${Date.now()}`
  : null;


  const companyName = companySettings?.name || 'QuoteFlow';
  const initials = companyName
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex items-center">
      <div className={`rounded-lg flex items-center justify-center overflow-hidden ${className}`}>
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={`${companyName} Logo`}
            className="w-full h-full object-contain"
            onError={(e) => {
              // Hide the image and show fallback
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                parent.innerHTML = `
                  <div class="w-full h-full bg-blue-600 flex items-center justify-center">
                    <span class="text-white font-bold text-lg">${initials}</span>
                  </div>
                `;
              }
            }}
          />
        ) : (
          <div className="w-full h-full bg-blue-600 flex items-center justify-center">
            <span className="text-white font-bold text-lg">{initials}</span>
          </div>
        )}
      </div>
      
      {showText && (
        <div className="ml-3">
          <h1 className="text-xl font-bold text-gray-900">{companyName}</h1>
          <p className="text-xs text-gray-600">Quotation Management System</p>
        </div>
      )}
    </div>
  );
};

// Fixed PublicLayout
export const PublicLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return (
    <Layout requireAuth={false} className="bg-white">
      <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <CompanyLogo showText={false} />
          </div>
          {/* Fix: Remove the duplicate hidden logo */}
          <div className="mt-4 text-center">
            <CompanyLogo className="w-8 h-8" showText={true} />
          </div>
        </div>
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10 border border-gray-200">
            {children}
          </div>
        </div>
      </div>
    </Layout>
  );
};

/**
 * Dashboard Layout - With additional dashboard-specific features
 */
export const DashboardLayout: React.FC<{ 
  children?: React.ReactNode;
  showQuickActions?: boolean;
}> = ({ children, showQuickActions = true }) => {
  return (
    <Layout>
      <div className="space-y-6">
        {/* Quick actions bar */}
        {showQuickActions && (
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
                <p className="text-sm text-gray-500">Get started with common tasks</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <a
                  href="/quotations/create"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  New Quotation
                </a>
                <a
                  href="/clients/create"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Add Client
                </a>
                <a
                  href="/invoices?status=OVERDUE"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  View Overdue
                </a>
              </div>
            </div>
          </div>
        )}
        {children}
      </div>
    </Layout>
  );
};

/**
 * Form Layout - Optimized for forms with consistent styling
 */
export const FormLayout: React.FC<{ 
  children?: React.ReactNode;
  title?: string;
  subtitle?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}> = ({ children, title, subtitle, maxWidth = 'lg' }) => {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl'
  };

  return (
    <Layout>
      <div className={`mx-auto ${maxWidthClasses[maxWidth]}`}>
        {(title || subtitle) && (
          <div className="mb-8 text-center">
            {title && (
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
            )}
            {subtitle && (
              <p className="text-gray-600">{subtitle}</p>
            )}
          </div>
        )}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          {children}
        </div>
      </div>
    </Layout>
  );
};

/**
 * Error Layout - For error pages
 */
export const ErrorLayout: React.FC<{ 
  children?: React.ReactNode;
  showNavigation?: boolean;
}> = ({ children, showNavigation = false }) => {
  if (showNavigation) {
    return <Layout>{children}</Layout>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">QF</span>
          </div>
        </div>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10 border border-gray-200 text-center">
          {children}
        </div>
      </div>
    </div>
  );
};

/**
 * Print Layout - Optimized for printing
 */
export const PrintLayout: React.FC<{ 
  children?: React.ReactNode;
  title?: string;
}> = ({ children, title }) => {
  useEffect(() => {
    // Add print-specific styles
    document.body.classList.add('print-mode');
    
    return () => {
      document.body.classList.remove('print-mode');
    };
  }, []);

  return (
    <div className="print:p-0 print:m-0 print:bg-white min-h-screen bg-white">
      {title && (
        <div className="print:hidden mb-4 p-4 bg-gray-100 border-b">
          <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
          <div className="mt-2">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Print Document
            </button>
          </div>
        </div>
      )}
      <div className="print:p-0 p-4">
        {children}
      </div>
    </div>
  );
};

// =============================================================================
// LAYOUT HELPERS
// =============================================================================

/**
 * Page wrapper for consistent spacing and styling
 */
export const PageContainer: React.FC<{ 
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <div className={`space-y-6 ${className}`}>
    {children}
  </div>
);

/**
 * Card wrapper for content sections
 */
export const Card: React.FC<{ 
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}> = ({ children, title, subtitle, action, className = '' }) => (
  <div className={`bg-white shadow-sm rounded-lg border border-gray-200 ${className}`}>
    {(title || subtitle || action) && (
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            {title && <h3 className="text-lg font-medium text-gray-900">{title}</h3>}
            {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      </div>
    )}
    <div className="px-6 py-4">
      {children}
    </div>
  </div>
);

/**
 * Empty state component
 */
export const EmptyState: React.FC<{
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}> = ({ icon, title, description, action }) => (
  <div className="text-center py-12">
    {icon && <div className="mx-auto h-12 w-12 text-gray-400 mb-4">{icon}</div>}
    <h3 className="mt-2 text-sm font-medium text-gray-900">{title}</h3>
    {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
    {action && <div className="mt-6">{action}</div>}
  </div>
);

export default Layout;