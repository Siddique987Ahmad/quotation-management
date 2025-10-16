import React from 'react';

// =============================================================================
// TYPES
// =============================================================================

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'white' | 'gray';
  className?: string;
  text?: string;
  fullScreen?: boolean;
  overlay?: boolean;
}

// =============================================================================
// COMPONENT
// =============================================================================

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'primary',
  className = '',
  text,
  fullScreen = false,
  overlay = false
}) => {
  // Size classes
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  // Color classes
  const colorClasses = {
    primary: 'text-blue-600',
    secondary: 'text-gray-600',
    white: 'text-white',
    gray: 'text-gray-400'
  };

  // Text size classes based on spinner size
  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  const spinnerElement = (
    <div className="flex flex-col items-center justify-center">
      {/* Spinner SVG */}
      <svg
        className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]} ${className}`}
        fill="none"
        viewBox="0 0 24 24"
        aria-label="Loading"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      
      {/* Loading text */}
      {text && (
        <p className={`mt-2 ${textSizeClasses[size]} ${colorClasses[color]} animate-pulse`}>
          {text}
        </p>
      )}
    </div>
  );

  // Full screen loading
  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
        {spinnerElement}
      </div>
    );
  }

  // Overlay loading
  if (overlay) {
    return (
      <div className="absolute inset-0 z-10 flex items-center justify-center bg-white bg-opacity-75">
        {spinnerElement}
      </div>
    );
  }

  // Regular loading spinner
  return spinnerElement;
};

// =============================================================================
// SPECIALIZED LOADING COMPONENTS
// =============================================================================

/**
 * Button loading spinner - for use inside buttons
 */
export const ButtonSpinner: React.FC<{
  size?: 'sm' | 'md';
  className?: string;
}> = ({ size = 'sm', className = '' }) => (
  <LoadingSpinner
    size={size}
    color="white"
    className={`mr-2 ${className}`}
  />
);

/**
 * Page loading spinner - for full page loading states
 */
export const PageSpinner: React.FC<{
  text?: string;
}> = ({ text = 'Loading...' }) => (
  <LoadingSpinner
    size="lg"
    color="primary"
    text={text}
    fullScreen
  />
);

/**
 * Card loading spinner - for loading states within cards/containers
 */
export const CardSpinner: React.FC<{
  text?: string;
  height?: string;
}> = ({ text = 'Loading...', height = 'h-64' }) => (
  <div className={`flex items-center justify-center ${height}`}>
    <LoadingSpinner
      size="md"
      color="primary"
      text={text}
    />
  </div>
);

/**
 * Table loading spinner - for loading states within tables
 */
export const TableSpinner: React.FC<{
  colSpan?: number;
  text?: string;
}> = ({ colSpan = 1, text = 'Loading data...' }) => (
  <tr>
    <td colSpan={colSpan} className="py-12 text-center">
      <LoadingSpinner
        size="md"
        color="primary"
        text={text}
      />
    </td>
  </tr>
);

/**
 * Inline loading spinner - for inline loading states
 */
export const InlineSpinner: React.FC<{
  text?: string;
  className?: string;
}> = ({ text, className = '' }) => (
  <div className={`inline-flex items-center ${className}`}>
    <LoadingSpinner size="sm" color="primary" />
    {text && <span className="ml-2 text-sm text-gray-600">{text}</span>}
  </div>
);

/**
 * Overlay loading spinner with backdrop
 */
export const OverlaySpinner: React.FC<{
  text?: string;
  backdrop?: 'light' | 'dark';
}> = ({ text = 'Processing...', backdrop = 'light' }) => {
  const backdropClasses = {
    light: 'bg-white bg-opacity-75',
    dark: 'bg-gray-900 bg-opacity-50'
  };

  const textColor = backdrop === 'dark' ? 'white' : 'primary';

  return (
    <div className={`absolute inset-0 z-20 flex items-center justify-center ${backdropClasses[backdrop]}`}>
      <LoadingSpinner
        size="lg"
        color={textColor}
        text={text}
      />
    </div>
  );
};

// =============================================================================
// LOADING STATES FOR SPECIFIC COMPONENTS
// =============================================================================

/**
 * Dashboard loading state
 */
export const DashboardLoader: React.FC = () => (
  <div className="space-y-6">
    {/* Stats cards skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
        </div>
      ))}
    </div>
    
    {/* Charts skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-lg shadow animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    </div>
  </div>
);

/**
 * Table loading skeleton
 */
export const TableLoader: React.FC<{
  rows?: number;
  columns?: number;
}> = ({ rows = 5, columns = 4 }) => (
  <div className="bg-white shadow rounded-lg overflow-hidden">
    <div className="px-6 py-4 border-b border-gray-200 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
    </div>
    <div className="divide-y divide-gray-200">
      {[...Array(rows)].map((_, rowIndex) => (
        <div key={rowIndex} className="px-6 py-4 animate-pulse">
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {[...Array(columns)].map((_, colIndex) => (
              <div key={colIndex} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

/**
 * Form loading skeleton
 */
export const FormLoader: React.FC<{
  fields?: number;
}> = ({ fields = 4 }) => (
  <div className="bg-white p-6 rounded-lg shadow animate-pulse">
    <div className="space-y-6">
      {[...Array(fields)].map((_, i) => (
        <div key={i}>
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      ))}
      <div className="flex justify-end space-x-3">
        <div className="h-10 bg-gray-200 rounded w-20"></div>
        <div className="h-10 bg-gray-200 rounded w-20"></div>
      </div>
    </div>
  </div>
);

export default LoadingSpinner;