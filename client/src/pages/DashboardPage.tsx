import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useCurrency } from "../contexts/CurrencyContext";
import {
  quotationsAPI,
  invoicesAPI,
  clientsAPI,
  usersAPI,
} from "../services/api";
import {
  getUser,
  getUserDisplayName,
  hasPermission,
  canSeeAllRecords,
} from "../utils/auth";
import {
  DashboardStats,
  QuotationStatus,
  InvoiceStatus,
  AsyncState,
} from "../types";
import LoadingSpinner, {
  CardSpinner,
  DashboardLoader,
} from "../components/LoadingSpinner";
import CurrencySwitcher from "../components/CurrencySwitcher";

// =============================================================================
// TYPES
// =============================================================================

interface DashboardData {
  stats: DashboardStats;
  recentQuotations: any[];
  recentInvoices: any[];
  overdueInvoices: any[];
  pendingQuotations: any[];
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  color: string;
  permission?: { resource: string; action: string };
}

// =============================================================================
// ICONS
// =============================================================================

const Icons = {
  Users: () => (
    <svg
      className="w-6 h-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
      />
    </svg>
  ),
  Clients: () => (
    <svg
      className="w-6 h-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
      />
    </svg>
  ),
  Quotations: () => (
    <svg
      className="w-6 h-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  ),
  Invoices: () => (
    <svg
      className="w-6 h-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
      />
    </svg>
  ),
  Plus: () => (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 4v16m8-8H4"
      />
    </svg>
  ),
  TrendingUp: () => (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
      />
    </svg>
  ),
  TrendingDown: () => (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
      />
    </svg>
  ),
  Clock: () => (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  AlertTriangle: () => (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
      />
    </svg>
  ),
  Eye: () => (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
      />
    </svg>
  ),
};

const quickActions: QuickAction[] = [
  {
    id: "create-quotation",
    title: "New Quotation",
    description: "Create a new quotation for a client",
    href: "/quotations/create",
    icon: <Icons.Quotations />,
    color: "bg-blue-600 hover:bg-blue-700",
    permission: { resource: "quotations", action: "create" },
  },
  {
    id: "add-client",
    title: "Add Client",
    description: "Register a new client",
    href: "/clients/create",
    icon: <Icons.Clients />,
    color: "bg-green-600 hover:bg-green-700",
    permission: { resource: "clients", action: "create" },
  },
  {
    id: "add-employee",
    title: "Add Employee",
    description: "Add a new employee to the system",
    href: "/users/create", // Fixed: Changed from '/employees/create'
    icon: <Icons.Users />,
    color: "bg-purple-600 hover:bg-purple-700",
    permission: { resource: "users", action: "create" },
  },
];

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

// const formatCurrency = (amount: number): string => {
//   return new Intl.NumberFormat("en-US", {
//     style: "currency",
//     currency: "USD",
//     minimumFractionDigits: 0,
//     maximumFractionDigits: 0,
//   }).format(amount);
// };

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const getStatusColor = (status: QuotationStatus | InvoiceStatus): string => {
  const quotationColors: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-800",
    PENDING: "bg-yellow-100 text-yellow-800",
    APPROVED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
    EXPIRED: "bg-gray-100 text-gray-600",
  };

  const invoiceColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    SENT: "bg-blue-100 text-blue-800",
    PAID: "bg-green-100 text-green-800",
    OVERDUE: "bg-red-100 text-red-800",
    CANCELLED: "bg-gray-100 text-gray-600",
  };

  return (
    quotationColors[status] ||
    invoiceColors[status] ||
    "bg-gray-100 text-gray-800"
  );
};

// Helper function to extract data array from API response
const extractDataArray = (
  response: any,
  fallbackProperty: string = "items"
): any[] => {
  // Handle different API response structures
  if (response?.data?.data) {
    // Check for different possible array properties
    const data = response.data.data;

    // Try common array property names
    if (data.quotations) return data.quotations;
    if (data.invoices) return data.invoices;
    if (data.users) return data.users;
    if (data.clients) return data.clients;
    if (data.items) return data.items;
    if (data.results) return data.results;

    // If data itself is an array
    if (Array.isArray(data)) return data;
  }

  // Fallback to empty array
  return [];
};

// =============================================================================
// COMPONENTS
// =============================================================================

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  color: string;
  href?: string;
  isCurrency?: boolean; // ADD THIS
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  icon,
  color,
  href,
  isCurrency = true,
}) => {
  const { format } = useCurrency(); 
  const content = (
    <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-200">
      <div className="p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={`p-3 rounded-md ${color}`}>
              <div className="text-white">{icon}</div>
            </div>
          </div>
          <div className="ml-4 w-0 flex-1">
            <div className="text-sm font-medium text-gray-500 truncate">
              {title}
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {/* {typeof value === "number" ? formatCurrency(value) : value} */}
              {/* {typeof value === "number" && isCurrency 
                ? formatCurrency(value) 
                : value} */}
                {typeof value === "number" && isCurrency 
          ? format(value)  // 👈 use context formatter
          : value}
            </div>
            {change !== undefined && (
              <div className="flex items-center mt-1">
                {change >= 0 ? <Icons.TrendingUp /> : <Icons.TrendingDown />}
                <span
                  className={`text-sm ml-1 ${
                    change >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {Math.abs(change)}%
                </span>
                <span className="text-xs text-gray-500 ml-1">
                  vs last month
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return href ? <Link to={href}>{content}</Link> : content;
};

interface QuickActionCardProps {
  action: QuickAction;
}

const QuickActionCard: React.FC<QuickActionCardProps> = ({ action }) => {
  // Check permissions
  if (
    action.permission &&
    !hasPermission(action.permission.resource as any, action.permission.action)
  ) {
    return null;
  }

  return (
    <Link
      to={action.href}
      className="block p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200"
    >
      <div className="flex items-center">
        <div
          className={`p-2 rounded-md ${action.color} text-white flex-shrink-0`}
        >
          {action.icon}
        </div>
        <div className="ml-3 flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {action.title}
          </p>
          <p className="text-xs text-gray-500 truncate">{action.description}</p>
        </div>
        <div className="ml-3 flex-shrink-0">
          <Icons.Plus />
        </div>
      </div>
    </Link>
  );
};

interface RecentItemsTableProps {
  title: string;
  items: any[];
  type: "quotations" | "invoices";
  loading: boolean;
  viewAllHref: string;
}

const RecentItemsTable: React.FC<RecentItemsTableProps> = ({
  title,
  items,
  type,
  loading,
  viewAllHref,
}) => {
  const { format } = useCurrency();
  if (loading) {
    return (
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        </div>
        <CardSpinner height="h-48" />
      </div>
    );
  }

  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        <Link
          to={viewAllHref}
          className="text-sm text-blue-600 hover:text-blue-500 flex items-center"
        >
          View all
          <Icons.Eye />
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <p className="text-gray-500 text-sm">No recent {type} found</p>
        </div>
      ) : (
        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {type === "quotations" ? "Quote #" : "Invoice #"}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.slice(0, 5).map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                    <Link to={`/${type}/${item.id}`}>
                      {type === "quotations"
                        ? item.quotationNumber
                        : item.invoiceNumber}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.client?.companyName || "Unknown Client"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {format(item.totalAmount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                        item.status
                      )}`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(item.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const DashboardPage: React.FC = () => {
  const currentUser = getUser();
  const { format } = useCurrency();
  const canSeeAll = canSeeAllRecords();

  const [dashboardState, setDashboardState] = useState<
    AsyncState<DashboardData>
  >({
    isLoading: true,
    error: null,
    data: null,
  });

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setDashboardState((prev) => ({
          ...prev,
          isLoading: true,
          error: null,
        }));

        const [
          quotationSummary,
          invoiceSummary,
          recentQuotations,
          recentInvoices,
        ] = await Promise.all([
          quotationsAPI.getDashboardSummary(),
          invoicesAPI.getDashboardSummary(),
          quotationsAPI.getAll({
            limit: 5,
            sortBy: "createdAt",
            sortOrder: "desc",
          }),
          invoicesAPI.getAll({
            limit: 5,
            sortBy: "createdAt",
            sortOrder: "desc",
          }),
        ]);

        // Extract arrays from API responses using the helper function
        const quotationsArray = extractDataArray(recentQuotations);
        const invoicesArray = extractDataArray(recentInvoices);

        // Mock stats structure (replace with actual API response structure)
        const dashboardData: DashboardData = {
          stats: {
            users: {
              total: 0,
              active: 0,
              newThisMonth: 0,
            },
            clients: {
              total: 0,
              active: 0,
              newThisMonth: 0,
            },
            quotations: quotationSummary.data.data?.summary || {
              total: 0,
              pending: 0,
              approved: 0,
              thisMonth: 0,
              totalValue: 0,
            },
            invoices: invoiceSummary.data.data?.summary || {
              total: 0,
              pending: 0,
              paid: 0,
              overdue: 0,
              totalValue: 0,
              paidValue: 0,
              outstandingValue: 0,
            },
            recentActivity: [], // 👈 added empty default
          },
          recentQuotations: quotationsArray,
          recentInvoices: invoicesArray,
          overdueInvoices: [],
          pendingQuotations: [],
        };

        setDashboardState({
          isLoading: false,
          error: null,
          data: dashboardData,
        });
      } catch (error: any) {
        console.error("Dashboard loading error:", error);
        setDashboardState({
          isLoading: false,
          error: error.message || "Failed to load dashboard data",
          data: null,
        });
      }
    };

    loadDashboardData();
  }, []);

  // Show loading state
  if (dashboardState.isLoading) {
    return <DashboardLoader />;
  }

  // Show error state
  if (dashboardState.error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <Icons.AlertTriangle />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Failed to Load Dashboard
        </h3>
        <p className="text-gray-500 mb-4">{dashboardState.error}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const { stats, recentQuotations, recentInvoices } = dashboardState.data!;

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {getUserDisplayName(currentUser)}!
            </h1>
            <p className="text-gray-600 mt-1">
              Here's what's happening with your quotations and invoices today.
            </p>
          </div>
          <CurrencySwitcher/>
          <div className="text-right">
            <p className="text-sm text-gray-500">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <QuickActionCard key={action.id} action={action} />
          ))}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Quotations"
          value={stats.quotations.total}
          icon={<Icons.Quotations />}
          color="bg-blue-600"
          href="/quotations" 
          isCurrency={false} // Fixed: No more /admin prefix
        />
        <StatCard
          title="Approved Quotes"
          value={stats.quotations.approved}
          icon={<Icons.Clock />}
          color="bg-yellow-600"
          href="/quotations?status=APPROVED" // Fixed: No more /admin prefix
          isCurrency={false}
        />
        <StatCard
          title="Total Revenue"
          value={stats.invoices.paidValue}
          icon={<Icons.TrendingUp />}
          color="bg-green-600"
        />
        <StatCard
          title="Overdue Amount"
          value={stats.invoices.outstandingValue}
          icon={<Icons.AlertTriangle />}
          color="bg-red-600"
          href="/invoices?status=OVERDUE" // Fixed: No more /admin prefix
        />
      </div>

      {/* Recent Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentItemsTable
          title="Recent Quotations"
          items={recentQuotations}
          type="quotations"
          loading={dashboardState.isLoading}
          viewAllHref="/quotations" // Fixed: No more /admin prefix
        />
        <RecentItemsTable
          title="Recent Invoices"
          items={recentInvoices}
          type="invoices"
          loading={dashboardState.isLoading}
          viewAllHref="/invoices" // Fixed: No more /admin prefix
        />
      </div>
    </div>
  );
};

export default DashboardPage;
