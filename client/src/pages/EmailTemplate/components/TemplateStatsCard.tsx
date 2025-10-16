import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface TemplateStatsCardProps {
  title: string;
  value: number;
  icon: string;
  color: 'blue' | 'green' | 'purple' | 'yellow' | 'red' | 'gray';
  change?: {
    value: number;
    type: 'increase' | 'decrease';
    period?: string;
  };
  subtitle?: string;
  onClick?: () => void;
}

const TemplateStatsCard: React.FC<TemplateStatsCardProps> = ({
  title,
  value,
  icon,
  color,
  change,
  subtitle,
  onClick
}) => {
  // Color configurations
  const colorConfigs = {
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-600',
      iconBg: 'bg-blue-100',
      hover: 'hover:bg-blue-100'
    },
    green: {
      bg: 'bg-green-50',
      border: 'border-green-200', 
      text: 'text-green-600',
      iconBg: 'bg-green-100',
      hover: 'hover:bg-green-100'
    },
    purple: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      text: 'text-purple-600',
      iconBg: 'bg-purple-100',
      hover: 'hover:bg-purple-100'
    },
    yellow: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-600',
      iconBg: 'bg-yellow-100',
      hover: 'hover:bg-yellow-100'
    },
    red: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-600',
      iconBg: 'bg-red-100',
      hover: 'hover:bg-red-100'
    },
    gray: {
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      text: 'text-gray-600',
      iconBg: 'bg-gray-100',
      hover: 'hover:bg-gray-100'
    }
  };

  const config = colorConfigs[color];

  const formatValue = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const CardContent = (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 ${config.iconBg} rounded-lg flex items-center justify-center`}>
          <span className="text-xl" role="img" aria-label={title}>
            {icon}
          </span>
        </div>
        
        {change && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
            change.type === 'increase' 
              ? 'bg-green-100 text-green-700' 
              : 'bg-red-100 text-red-700'
          }`}>
            {change.type === 'increase' ? (
              <TrendingUp size={12} />
            ) : (
              <TrendingDown size={12} />
            )}
            {change.value > 0 ? '+' : ''}{change.value}%
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="mb-2">
        <div className={`text-3xl font-bold ${config.text} mb-1`}>
          {formatValue(value)}
        </div>
        <div className="text-sm font-medium text-gray-700 mb-1">
          {title}
        </div>
        {subtitle && (
          <div className="text-xs text-gray-500">
            {subtitle}
          </div>
        )}
      </div>

      {/* Change Period */}
      {change?.period && (
        <div className="text-xs text-gray-400 mt-2">
          {change.period}
        </div>
      )}

      {/* Progress Indicator (optional visual enhancement) */}
      {value > 0 && (
        <div className="mt-3">
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div 
              className={`h-1 rounded-full transition-all duration-300 ${
                config.text.replace('text-', 'bg-')
              }`}
              style={{ 
                width: `${Math.min(100, (value / Math.max(value, 10)) * 100)}%` 
              }}
            />
          </div>
        </div>
      )}
    </>
  );

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={`w-full p-6 rounded-lg border-2 transition-all duration-200 text-left ${
          config.bg
        } ${config.border} ${config.hover} hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
      >
        {CardContent}
      </button>
    );
  }

  return (
    <div className={`p-6 rounded-lg border-2 ${config.bg} ${config.border}`}>
      {CardContent}
    </div>
  );
};

// Specialized stats cards for common template metrics
export const ActiveTemplatesCard: React.FC<{ 
  value: number; 
  total: number; 
  onClick?: () => void;
}> = ({ value, total, onClick }) => (
  <TemplateStatsCard
    title="Active Templates"
    value={value}
    icon="✅"
    color="green"
    subtitle={`${total - value} inactive`}
    onClick={onClick}
  />
);

export const SystemTemplatesCard: React.FC<{ 
  value: number; 
  onClick?: () => void;
}> = ({ value, onClick }) => (
  <TemplateStatsCard
    title="System Templates"
    value={value}
    icon="⚙️"
    color="gray"
    subtitle="Protected templates"
    onClick={onClick}
  />
);

export const CustomTemplatesCard: React.FC<{ 
  value: number; 
  change?: { value: number; type: 'increase' | 'decrease' };
  onClick?: () => void;
}> = ({ value, change, onClick }) => (
  <TemplateStatsCard
    title="Custom Templates"
    value={value}
    icon="🎨"
    color="purple"
    change={change}
    subtitle="User-created templates"
    onClick={onClick}
  />
);

export const TotalTemplatesCard: React.FC<{ 
  value: number; 
  onClick?: () => void;
}> = ({ value, onClick }) => (
  <TemplateStatsCard
    title="Total Templates"
    value={value}
    icon="📧"
    color="blue"
    onClick={onClick}
  />
);

// Category-specific stats cards
export const QuotationTemplatesCard: React.FC<{ 
  value: number; 
  onClick?: () => void;
}> = ({ value, onClick }) => (
  <TemplateStatsCard
    title="Quotation Templates"
    value={value}
    icon="📋"
    color="green"
    onClick={onClick}
  />
);

export const InvoiceTemplatesCard: React.FC<{ 
  value: number; 
  onClick?: () => void;
}> = ({ value, onClick }) => (
  <TemplateStatsCard
    title="Invoice Templates"
    value={value}
    icon="📄"
    color="yellow"
    onClick={onClick}
  />
);

export const UserTemplatesCard: React.FC<{ 
  value: number; 
  onClick?: () => void;
}> = ({ value, onClick }) => (
  <TemplateStatsCard
    title="User Templates"
    value={value}
    icon="👤"
    color="blue"
    onClick={onClick}
  />
);

export const NotificationTemplatesCard: React.FC<{ 
  value: number; 
  onClick?: () => void;
}> = ({ value, onClick }) => (
  <TemplateStatsCard
    title="Notification Templates"
    value={value}
    icon="🔔"
    color="purple"
    onClick={onClick}
  />
);

// Usage stats cards (for future analytics)
export const TemplateUsageCard: React.FC<{
  title: string;
  value: number;
  change?: { value: number; type: 'increase' | 'decrease'; period: string };
  onClick?: () => void;
}> = ({ title, value, change, onClick }) => (
  <TemplateStatsCard
    title={title}
    value={value}
    icon="📊"
    color="blue"
    change={change}
    onClick={onClick}
  />
);

export const EmailsSentCard: React.FC<{
  value: number;
  period?: string;
  change?: { value: number; type: 'increase' | 'decrease' };
  onClick?: () => void;
}> = ({ value, period, change, onClick }) => (
  <TemplateStatsCard
    title="Emails Sent"
    value={value}
    icon="📤"
    color="green"
    change={change}
    subtitle={period || 'This month'}
    onClick={onClick}
  />
);

export default TemplateStatsCard;