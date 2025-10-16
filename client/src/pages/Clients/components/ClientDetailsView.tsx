import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Client } from '../../../types';
import { CardSpinner } from '../../../components/LoadingSpinner';
import { Icons } from '../../../components/Icons/Icons';

interface ClientDetailsViewProps {
  client: Client | null;
  loading: boolean;
  error: string | null;
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const ClientDetailsView: React.FC<ClientDetailsViewProps> = ({
  client,
  loading,
  error
}) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
        <CardSpinner text="Loading client details..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
        <div className="text-center text-red-600">
          <p>Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
        <div className="text-center">
          <p className="text-gray-500">Client not found</p>
        </div>
      </div>
    );
  }

  // Render custom fields section
  const renderCustomFields = () => {
    if (!client.customFields || typeof client.customFields !== 'object' || Object.keys(client.customFields).length === 0) {
      return null;
    }

    return (
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Custom Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(client.customFields).map(([key, value]) => (
            <div key={key} className="p-4 bg-gray-50 rounded-lg">
              <dt className="text-sm font-medium text-gray-500 mb-1">
                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </dt>
              <dd className="text-sm text-gray-900">
                {typeof value === 'boolean' 
                  ? (value ? 'Yes' : 'No') 
                  : (value?.toString() || 'Not provided')
                }
              </dd>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200">
      <div className="p-6">
        {/* Client Header */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="h-16 w-16 rounded-lg bg-blue-600 flex items-center justify-center">
            <span className="text-xl font-medium text-white">
              {client.companyName[0]?.toUpperCase()}
            </span>
          </div>
          <div>
            <h2 className="text-xl font-medium text-gray-900">
              {client.companyName}
            </h2>
            <p className="text-gray-600">{client.contactPerson}</p>
            <div className="flex items-center space-x-4 mt-2">
              <span className={`inline-flex items-center text-sm ${client.isActive ? 'text-green-600' : 'text-red-600'}`}>
                <div className="w-4 h-4 mr-1">
                  {client.isActive ? <Icons.CheckCircle /> : <Icons.XCircle />}
                </div>
                <span>{client.isActive ? 'Active' : 'Inactive'}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Main Client Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Icons.Mail />
              <span className="ml-2">Contact Information</span>
            </h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Company Name</dt>
                <dd className="text-sm text-gray-900">{client.companyName}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Contact Person</dt>
                <dd className="text-sm text-gray-900">{client.contactPerson}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="text-sm text-gray-900">
                  <a href={`mailto:${client.email}`} className="text-blue-600 hover:text-blue-800">
                    {client.email}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Phone</dt>
                <dd className="text-sm text-gray-900">
                  {client.phone ? (
                    <a href={`tel:${client.phone}`} className="text-blue-600 hover:text-blue-800">
                      {client.phone}
                    </a>
                  ) : (
                    'Not provided'
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Tax ID</dt>
                <dd className="text-sm text-gray-900">{client.taxId || 'Not provided'}</dd>
              </div>
            </dl>
          </div>

          {/* Address & Business Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Icons.MapPin />
              <span className="ml-2">Address & Business</span>
            </h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Address</dt>
                <dd className="text-sm text-gray-900">
                  {client.address ? (
                    <div className="space-y-1">
                      <div>{client.address}</div>
                      {(client.city || client.state || client.zipCode) && (
                        <div>
                          {[client.city, client.state, client.zipCode].filter(Boolean).join(', ')}
                        </div>
                      )}
                      {client.country && <div>{client.country}</div>}
                    </div>
                  ) : (
                    'Not provided'
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Business Activity</dt>
                <dd className="text-sm text-gray-900">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <Icons.FileText />
                      <span className="ml-1">{(client as any).statistics?.totalQuotations || 0} quotations</span>
                    </div>
                    <div className="flex items-center">
                      <Icons.FileText />
                      <span className="ml-1">{(client as any).statistics?.totalInvoices || 0} invoices</span>
                    </div>
                  </div>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Client Since</dt>
                <dd className="text-sm text-gray-900">{formatDate(client.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                <dd className="text-sm text-gray-900">{formatDate(client.updatedAt || client.createdAt)}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Custom Fields Section */}
        {renderCustomFields()}

        {/* Business Statistics */}
        {((client as any).statistics?.totalQuotationValue || (client as any).statistics?.totalInvoiceValue) && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Icons.TrendingUp />
              <span className="ml-2">Business Summary</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                      <Icons.FileText />
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-blue-900">Total Quotations</p>
                    <p className="text-lg font-semibold text-blue-600">
                      {(client as any).statistics?.totalQuotations || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                      <Icons.FileText />
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-900">Total Invoices</p>
                    <p className="text-lg font-semibold text-green-600">
                      {(client as any).statistics?.totalInvoices || 0}
                    </p>
                  </div>
                </div>
              </div>

              {(client as any).statistics?.totalQuotationValue > 0 && (
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center">
                        <Icons.TrendingUp />
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-purple-900">Quotation Value</p>
                      <p className="text-lg font-semibold text-purple-600">
                        ${((client as any).statistics.totalQuotationValue).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {(client as any).statistics?.totalInvoiceValue > 0 && (
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-orange-100 rounded-md flex items-center justify-center">
                        <Icons.TrendingUp />
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-orange-900">Invoice Value</p>
                      <p className="text-lg font-semibold text-orange-600">
                        ${((client as any).statistics.totalInvoiceValue).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        {/* <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Icons.Zap />
            <span className="ml-2">Quick Actions</span>
          </h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate(`/quotations/create?clientId=${client.id}`)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <Icons.FileText />
              <span className="ml-2">Create Quotation</span>
            </button>
            
            <button
              onClick={() => navigate(`/quotations?clientId=${client.id}`)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Icons.Eye />
              <span className="ml-2">View Quotations</span>
            </button>
            
            <button
              onClick={() => navigate(`/invoices?clientId=${client.id}`)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Icons.FileText />
              <span className="ml-2">View Invoices</span>
            </button>

            {client.email && (
              <button
                onClick={() => window.open(`mailto:${client.email}?subject=Business%20Inquiry`, '_blank')}
                className="inline-flex items-center px-4 py-2 border border-green-300 rounded-md shadow-sm text-sm font-medium text-green-700 bg-white hover:bg-green-50"
              >
                <Icons.Mail />
                <span className="ml-2">Send Email</span>
              </button>
            )}

            {client.phone && (
              <button
                onClick={() => window.open(`tel:${client.phone}`, '_self')}
                className="inline-flex items-center px-4 py-2 border border-blue-300 rounded-md shadow-sm text-sm font-medium text-blue-700 bg-white hover:bg-blue-50"
              >
                <Icons.Phone />
                <span className="ml-2">Call Client</span>
              </button>
            )}
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default ClientDetailsView;