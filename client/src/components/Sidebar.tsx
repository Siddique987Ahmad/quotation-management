// import React, { useState } from 'react';
// import { Link, useLocation } from 'react-router-dom';
// import { 
//   getUserPermissions, 
//   canAccessAdmin, 
//   getUserDisplayName, 
//   getUser,
//   hasRoleOrHigher 
// } from '../utils/auth';
// import { Role } from '../types';
// import CompanyLogo from "./Layout"
// // =============================================================================
// // TYPES
// // =============================================================================

// interface SidebarProps {
//   isOpen: boolean;
//   onClose: () => void;
//   className?: string;
// }

// interface MenuItem {
//   id: string;
//   label: string;
//   path: string;
//   icon: React.ReactNode;
//   badge?: string | number;
//   requiresAuth?: boolean;
//   requiredRole?: Role;
//   requiredPermissions?: { resource: string; action: string }[];
//   children?: MenuItem[];
// }

// // =============================================================================
// // ICONS
// // =============================================================================

// const Icons = {
//   Dashboard: () => (
//     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
//       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
//     </svg>
//   ),
//   Users: () => (
//     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
//     </svg>
//   ),
//   Clients: () => (
//     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
//     </svg>
//   ),
//   Quotations: () => (
//     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
//     </svg>
//   ),
//   Invoices: () => (
//     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
//     </svg>
//   ),
//   // Reports: () => (
//   //   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//   //     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
//   //   </svg>
//   // ),
//   Settings: () => (
//     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
//       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
//     </svg>
//   ),
//   ChevronDown: () => (
//     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
//     </svg>
//   ),
//   ChevronRight: () => (
//     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
//     </svg>
//   )
// };

// // =============================================================================
// // MENU CONFIGURATION
// // =============================================================================

// // Updated menuItems for unified routing system
// const menuItems: MenuItem[] = [
//   {
//     id: 'dashboard',
//     label: 'Dashboard',
//     path: '/dashboard',
//     icon: <Icons.Dashboard />,
//     requiresAuth: true
//   },
//   {
//     id: 'clients',
//     label: 'Clients',
//     path: '/clients',
//     icon: <Icons.Clients />,
//     requiresAuth: true,
//     requiredPermissions: [{ resource: 'clients', action: 'read' }],
//     children: [
//       {
//         id: 'clients-all',
//         label: 'All Clients',
//         path: '/clients',
//         icon: <Icons.Clients />,
//         requiredPermissions: [{ resource: 'clients', action: 'read' }]
//       },
//       {
//         id: 'clients-create',
//         label: 'Add Client',
//         path: '/clients/create',
//         icon: <Icons.Clients />,
//         requiredPermissions: [{ resource: 'clients', action: 'create' }]
//       }
//     ]
//   },
//   {
//     id: 'quotations',
//     label: 'Quotations',
//     path: '/quotations',
//     icon: <Icons.Quotations />,
//     requiresAuth: true,
//     requiredPermissions: [{ resource: 'quotations', action: 'read' }],
//     children: [
//       {
//         id: 'quotations-all',
//         label: 'My Quotations',
//         path: '/quotations',
//         icon: <Icons.Quotations />,
//         requiredPermissions: [{ resource: 'quotations', action: 'read' }]
//       },
//       {
//         id: 'quotations-create',
//         label: 'Create Quote',
//         path: '/quotations/create',
//         icon: <Icons.Quotations />,
//         requiredPermissions: [{ resource: 'quotations', action: 'create' }]
//       },
//       {
//         id: 'quotations-pending',
//         label: 'Pending Approval',
//         path: '/quotations?status=PENDING',
//         icon: <Icons.Quotations />,
//         requiredPermissions: [{ resource: 'quotations', action: 'approve' }]
//       },
//       {
//         id: 'quotations-approved',
//         label: 'Approved Quotes',
//         path: '/quotations?status=APPROVED',
//         icon: <Icons.Quotations />,
//         requiredPermissions: [{ resource: 'quotations', action: 'read' }]
//       }
//     ]
//   },
//   {
//     id: 'invoices',
//     label: 'Invoices',
//     path: '/invoices',
//     icon: <Icons.Invoices />,
//     requiresAuth: true,
//     requiredPermissions: [{ resource: 'invoices', action: 'read' }],
//     children: [
//       {
//         id: 'invoices-all',
//         label: 'My Invoices',
//         path: '/invoices',
//         icon: <Icons.Invoices />,
//         requiredPermissions: [{ resource: 'invoices', action: 'read' }]
//       },
//       {
//         id: 'invoices-pending',
//         label: 'Pending Payment',
//         path: '/invoices?status=SENT',
//         icon: <Icons.Invoices />,
//         requiredPermissions: [{ resource: 'invoices', action: 'read' }]
//       },
//       {
//         id: 'invoices-paid',
//         label: 'Paid Invoices',
//         path: '/invoices?status=PAID',
//         icon: <Icons.Invoices />,
//         requiredPermissions: [{ resource: 'invoices', action: 'read' }]
//       }
//     ]
//   },
//   // {
//   //   id: 'reports',
//   //   label: 'Reports',
//   //   path: '/reports',
//   //   icon: <Icons.Reports />,
//   //   requiresAuth: true,
//   //   requiredRole: Role.MANAGER, // Only managers and above
//   //   children: [
//   //     {
//   //       id: 'reports-dashboard',
//   //       label: 'Overview',
//   //       path: '/reports',
//   //       icon: <Icons.Reports />
//   //     },
//   //     {
//   //       id: 'reports-sales',
//   //       label: 'Sales Report',
//   //       path: '/reports/sales',
//   //       icon: <Icons.Reports />
//   //     },
//   //     {
//   //       id: 'reports-clients',
//   //       label: 'Client Report',
//   //       path: '/reports/clients',
//   //       icon: <Icons.Reports />
//   //     }
//   //   ]
//   // },
//   // FIXED: Changed from 'employees' to 'users' to match backend routes
//   {
//     id: 'users',
//     label: 'Employee Management',
//     path: '/users', // Changed from '/employees'
//     icon: <Icons.Users />,
//     requiresAuth: true,
//     requiredPermissions: [{ resource: 'users', action: 'read' }], // Only admins
//     children: [
//       {
//         id: 'users-all',
//         label: 'All Employees',
//         path: '/users', // Changed from '/employees'
//         icon: <Icons.Users />
//       },
//       {
//         id: 'users-create',
//         label: 'Add Employee',
//         path: '/users/create', // Changed from '/employees/create'
//         icon: <Icons.Users />,
//         requiredPermissions: [{ resource: 'users', action: 'create' }]
//       }
//     ]
//   },
//   {
//     id: 'settings',
//     label: 'Settings',
//     path: '/settings',
//     icon: <Icons.Settings />,
//     requiresAuth: true,
//     requiredRole: Role.ADMIN, // Only admins and above
//     children: [
//       {
//         id: 'settings-general',
//         label: 'General',
//         path: '/settings/general',
//         icon: <Icons.Settings />
//       },
//       {
//         id: 'settings-email',
//         label: 'Email Templates',
//         path: '/settings/email',
//         icon: <Icons.Settings />
//       },
//       {
//         id: 'settings-tax',
//         label: 'Tax Settings',
//         path: '/settings/tax',
//         icon: <Icons.Settings />
//       }
//     ]
//   }
// ];

// // =============================================================================
// // HELPER FUNCTIONS
// // =============================================================================

// const canAccessMenuItem = (item: MenuItem): boolean => {
//   // Check authentication
//   if (item.requiresAuth && !getUser()) {
//     return false;
//   }

//   // Check role requirement
//   if (item.requiredRole && !hasRoleOrHigher(item.requiredRole)) {
//     return false;
//   }

//   // Check permission requirements
//   if (item.requiredPermissions) {
//     const permissions = getUserPermissions();
//     const hasAllPermissions = item.requiredPermissions.every(({ resource, action }) => {
//       const resourcePermissions = permissions[resource as keyof typeof permissions];
//       return resourcePermissions && (resourcePermissions as any)[action] === true;
//     });
//     if (!hasAllPermissions) {
//       return false;
//     }
//   }

//   return true;
// };

// // =============================================================================
// // COMPONENTS
// // =============================================================================

// interface MenuItemComponentProps {
//   item: MenuItem;
//   isActive: boolean;
//   hasChildren: boolean;
//   isExpanded: boolean;
//   onToggle: () => void;
//   onClose: () => void;
// }

// const MenuItemComponent: React.FC<MenuItemComponentProps> = ({
//   item,
//   isActive,
//   hasChildren,
//   isExpanded,
//   onToggle,
//   onClose
// }) => {
//   const baseClasses = "flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors duration-150 ease-in-out";
//   const activeClasses = "bg-blue-100 text-blue-900";
//   const inactiveClasses = "text-gray-600 hover:bg-gray-50 hover:text-gray-900";

//   if (hasChildren) {
//     return (
//       <div>
//         <button
//           onClick={onToggle}
//           className={`${baseClasses} w-full justify-between ${
//             isActive ? activeClasses : inactiveClasses
//           }`}
//         >
//           <div className="flex items-center">
//             {item.icon}
//             <span className="ml-3">{item.label}</span>
//             {item.badge && (
//               <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
//                 {item.badge}
//               </span>
//             )}
//           </div>
//           <div className={`transform transition-transform duration-150 ${isExpanded ? 'rotate-90' : ''}`}>
//             <Icons.ChevronRight />
//           </div>
//         </button>
//       </div>
//     );
//   }

//   return (
//     <Link
//       to={item.path}
//       onClick={onClose}
//       className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
//     >
//       {item.icon}
//       <span className="ml-3">{item.label}</span>
//       {item.badge && (
//         <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
//           {item.badge}
//         </span>
//       )}
//     </Link>
//   );
// };

// // =============================================================================
// // MAIN COMPONENT
// // =============================================================================

// const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, className = '' }) => {
//   const location = useLocation();
//   const [expandedItems, setExpandedItems] = useState<string[]>([]);
//   const currentUser = getUser();

//   // Toggle expanded state for menu items with children
//   const toggleExpanded = (itemId: string) => {
//     setExpandedItems(prev => 
//       prev.includes(itemId) 
//         ? prev.filter(id => id !== itemId)
//         : [...prev, itemId]
//     );
//   };

//   // Check if current path matches item path - Updated for better matching
//   const isItemActive = (item: MenuItem): boolean => {
//     if (item.children) {
//       return item.children.some(child => {
//         // Exact match for paths with query parameters
//         if (child.path.includes('?')) {
//           return location.pathname + location.search === child.path;
//         }
//         // Exact match for regular paths
//         return location.pathname === child.path;
//       });
//     }
    
//     // For parent items, check if path starts with the base path
//     if (item.path.includes('?')) {
//       return location.pathname + location.search === item.path;
//     }
    
//     return location.pathname === item.path || location.pathname.startsWith(item.path + '/');
//   };

//   // Filter menu items based on user permissions
//   const visibleMenuItems = menuItems.filter(canAccessMenuItem);

//   // Auto-expand active parent items
//   React.useEffect(() => {
//     menuItems.forEach(item => {
//       if (item.children && item.children.some(child => {
//         if (child.path.includes('?')) {
//           return location.pathname + location.search === child.path;
//         }
//         return location.pathname === child.path || location.pathname.startsWith(child.path + '/');
//       })) {
//         if (!expandedItems.includes(item.id)) {
//           setExpandedItems(prev => [...prev, item.id]);
//         }
//       }
//     });
//   }, [location.pathname, location.search]);

//   return (
//     <>
//       {/* Mobile overlay */}
//       {isOpen && (
//         <div
//           className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
//           onClick={onClose}
//         />
//       )}

//       {/* Sidebar */}
//       <div
//         className={`
//           fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0
//           ${isOpen ? 'translate-x-0' : '-translate-x-full'}
//           ${className}
//         `}
//       >
//         <div className="flex flex-col h-full">
//           {/* Sidebar header */}
//           <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
//             <div className="flex items-center">
//               <div className="flex-shrink-0">
//                 <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
//                   <span className="text-white font-bold text-sm">QMS</span>
//                 </div>
//               </div>
//               <div className="ml-3">
//                 <h2 className="text-lg font-semibold text-gray-900">QuoteFlow</h2>
//                 <p className="text-xs text-gray-500">Quotation Management</p>
//               </div>
//             </div>
//             <button
//               onClick={onClose}
//               className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
//             >
//               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//               </svg>
//             </button>
//           </div>

//           {/* User info */}
//           {currentUser && (
//             <div className="px-4 py-3 border-b border-gray-200">
//               <div className="flex items-center">
//                 <div className="flex-shrink-0">
//                   <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
//                     <span className="text-sm font-medium text-gray-700">
//                       {currentUser.firstName[0]}{currentUser.lastName[0]}
//                     </span>
//                   </div>
//                 </div>
//                 <div className="ml-3 min-w-0 flex-1">
//                   <p className="text-sm font-medium text-gray-900 truncate">
//                     {getUserDisplayName(currentUser)}
//                   </p>
//                   <p className="text-xs text-gray-500 truncate">{currentUser.role}</p>
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* Navigation */}
//           <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
//             {visibleMenuItems.map((item) => {
//               const isActive = isItemActive(item);
//               const hasChildren = item.children && item.children.length > 0;
//               const isExpanded = expandedItems.includes(item.id);
//               const visibleChildren = hasChildren ? item.children!.filter(canAccessMenuItem) : [];

//               return (
//                 <div key={item.id}>
//                   <MenuItemComponent
//                     item={item}
//                     isActive={isActive}
//                     hasChildren={Boolean(hasChildren && visibleChildren.length > 0)}
//                     isExpanded={isExpanded}
//                     onToggle={() => toggleExpanded(item.id)}
//                     onClose={onClose}
//                   />
                  
//                   {/* Sub-menu items */}
//                   {hasChildren && isExpanded && visibleChildren.length > 0 && (
//                     <div className="ml-4 mt-1 space-y-1">
//                       {visibleChildren.map((child) => {
//                         // Better child active state detection
//                         const isChildActive = child.path.includes('?') 
//                           ? location.pathname + location.search === child.path
//                           : location.pathname === child.path || location.pathname.startsWith(child.path + '/');
                          
//                         return (
//                           <Link
//                             key={child.id}
//                             to={child.path}
//                             onClick={onClose}
//                             className={`flex items-center px-4 py-2 text-sm rounded-md transition-colors duration-150 ease-in-out ${
//                               isChildActive
//                                 ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
//                                 : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
//                             }`}
//                           >
//                             <div className="w-4 h-4 mr-3 flex items-center justify-center">
//                               <div className={`w-1.5 h-1.5 rounded-full ${
//                                 isChildActive ? 'bg-blue-600' : 'bg-gray-400'
//                               }`} />
//                             </div>
//                             <span>{child.label}</span>
//                             {child.badge && (
//                               <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
//                                 {child.badge}
//                               </span>
//                             )}
//                           </Link>
//                         );
//                       })}
//                     </div>
//                   )}
//                 </div>
//               );
//             })}
//           </nav>

//           {/* Sidebar footer */}
//           <div className="px-4 py-4 border-t border-gray-200">
//             <div className="text-xs text-gray-500 text-center">
//               <p>QuoteFlow v1.0.0</p>
//               <p>© 2024 Your Company</p>
//             </div>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// };

// export default Sidebar;



import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  getUserPermissions, 
  canAccessAdmin, 
  getUserDisplayName, 
  getUser,
  hasRoleOrHigher 
} from '../utils/auth';
import { Role } from '../types';
import { useCompany } from '../contexts/CompanyContext'; // Add this import

// =============================================================================
// TYPES
// =============================================================================

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

interface MenuItem {
  id: string;
  label: string;
  path: string;
  icon: React.ReactNode;
  badge?: string | number;
  requiresAuth?: boolean;
  requiredRole?: Role;
  requiredPermissions?: { resource: string; action: string }[];
  children?: MenuItem[];
}

// =============================================================================
// COMPANY LOGO COMPONENT FOR SIDEBAR
// =============================================================================

const SidebarCompanyLogo: React.FC<{ className?: string }> = ({ className = "w-8 h-8" }) => {
  const { companySettings, loading } = useCompany();

  if (loading) {
    return (
      <div className={`bg-gray-200 rounded-lg animate-pulse ${className}`} />
    );
  }

  const logoUrl = companySettings?.logo
    ? `${process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://148.230.82.188:5000'}${companySettings.logo}?t=${Date.now()}`
    : null;

  const companyName = companySettings?.name || 'QuoteFlow';
  const initials = companyName
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={`rounded-lg flex items-center justify-center overflow-hidden ${className}`}>
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={`${companyName} Logo`}
          className="w-full h-full object-contain"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent && !parent.querySelector('.logo-fallback')) {
              const fallback = document.createElement('div');
              fallback.className = 'logo-fallback w-full h-full bg-blue-600 flex items-center justify-center';
              fallback.innerHTML = `<span class="text-white font-bold text-sm">${initials}</span>`;
              parent.appendChild(fallback);
            }
          }}
        />
      ) : (
        <div className="w-full h-full bg-blue-600 flex items-center justify-center">
          <span className="text-white font-bold text-sm">{initials}</span>
        </div>
      )}
    </div>
  );
};

// =============================================================================
// ICONS (keeping your existing icons)
// =============================================================================

const Icons = {
  Dashboard: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
    </svg>
  ),
  Users: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
    </svg>
  ),
  Clients: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  Quotations: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  Invoices: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  ),
  Settings: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  ChevronDown: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  ),
  ChevronRight: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  )
};

// Keep your existing menuItems array unchanged...
const menuItems: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/dashboard',
    icon: <Icons.Dashboard />,
    requiresAuth: true
  },
  {
    id: 'clients',
    label: 'Clients',
    path: '/clients',
    icon: <Icons.Clients />,
    requiresAuth: true,
    requiredPermissions: [{ resource: 'clients', action: 'read' }],
    children: [
      {
        id: 'clients-all',
        label: 'All Clients',
        path: '/clients',
        icon: <Icons.Clients />,
        requiredPermissions: [{ resource: 'clients', action: 'read' }]
      },
      {
        id: 'clients-create',
        label: 'Add Client',
        path: '/clients/create',
        icon: <Icons.Clients />,
        requiredPermissions: [{ resource: 'clients', action: 'create' }]
      }
    ]
  },
  {
    id: 'quotations',
    label: 'Quotations',
    path: '/quotations',
    icon: <Icons.Quotations />,
    requiresAuth: true,
    requiredPermissions: [{ resource: 'quotations', action: 'read' }],
    children: [
      {
        id: 'quotations-all',
        label: 'My Quotations',
        path: '/quotations',
        icon: <Icons.Quotations />,
        requiredPermissions: [{ resource: 'quotations', action: 'read' }]
      },
      {
        id: 'quotations-create',
        label: 'Create Quote',
        path: '/quotations/create',
        icon: <Icons.Quotations />,
        requiredPermissions: [{ resource: 'quotations', action: 'create' }]
      },
      // {
      //   id: 'quotations-pending',
      //   label: 'Pending Approval',
      //   path: '/quotations?status=PENDING',
      //   icon: <Icons.Quotations />,
      //   requiredPermissions: [{ resource: 'quotations', action: 'approve' }]
      // },
      // {
      //   id: 'quotations-approved',
      //   label: 'Approved Quotes',
      //   path: '/quotations?status=APPROVED',
      //   icon: <Icons.Quotations />,
      //   requiredPermissions: [{ resource: 'quotations', action: 'read' }]
      // }
    ]
  },
  {
    id: 'invoices',
    label: 'Invoices',
    path: '/invoices',
    icon: <Icons.Invoices />,
    requiresAuth: true,
    requiredPermissions: [{ resource: 'invoices', action: 'read' }],
    children: [
      {
        id: 'invoices-all',
        label: 'My Invoices',
        path: '/invoices',
        icon: <Icons.Invoices />,
        requiredPermissions: [{ resource: 'invoices', action: 'read' }]
      },
      // {
      //   id: 'invoices-pending',
      //   label: 'Pending Payment',
      //   path: '/invoices?status=SENT',
      //   icon: <Icons.Invoices />,
      //   requiredPermissions: [{ resource: 'invoices', action: 'read' }]
      // },
      // {
      //   id: 'invoices-paid',
      //   label: 'Paid Invoices',
      //   path: '/invoices?status=PAID',
      //   icon: <Icons.Invoices />,
      //   requiredPermissions: [{ resource: 'invoices', action: 'read' }]
      // }
    ]
  },
  {
    id: 'users',
    label: 'Employee Management',
    path: '/users',
    icon: <Icons.Users />,
    requiresAuth: true,
    requiredPermissions: [{ resource: 'users', action: 'read' }],
    children: [
      {
        id: 'users-all',
        label: 'All Employees',
        path: '/users',
        icon: <Icons.Users />
      },
      // {
      //   id: 'users-create',
      //   label: 'Add Employee',
      //   path: '/users/create',
      //   icon: <Icons.Users />,
      //   requiredPermissions: [{ resource: 'users', action: 'create' }]
      // }
  //      {
  //   id: 'users-permissions',
  //   label: 'Manage Permissions',
  //   path: '/users', // Goes to list, then click permissions on a user
  //   icon: <Icons.Users />,
  //   // requiredPermissions: [{ resource: 'users', action: 'manage_permissions' }]
  // }
    ]
  },
  {
    id: 'settings',
    label: 'Settings',
    path: '/settings',
    icon: <Icons.Settings />,
    requiresAuth: true,
    requiredRole: Role.ADMIN,
    children: [
      {
        id: 'settings-general',
        label: 'General',
        path: '/settings/general',
        icon: <Icons.Settings />
      },
      {
        id: 'settings-email',
        label: 'Email Templates',
        path: '/settings/email-templates',
        icon: <Icons.Settings />
      },
      // {
      //   id: 'settings-tax',
      //   label: 'Tax Settings',
      //   path: '/settings/tax',
      //   icon: <Icons.Settings />
      // },
      {
        id: 'settings-roles',
        label: 'Roles Settings',
        path: '/settings/role-permissions',
        icon: <Icons.Settings />
      },
    ]
  }
];

// Keep your existing helper functions unchanged...
const canAccessMenuItem = (item: MenuItem): boolean => {
  if (item.requiresAuth && !getUser()) {
    return false;
  }

  if (item.requiredRole && !hasRoleOrHigher(item.requiredRole)) {
    return false;
  }

  if (item.requiredPermissions) {
    const permissions = getUserPermissions();
    const hasAllPermissions = item.requiredPermissions.every(({ resource, action }) => {
      const resourcePermissions = permissions[resource as keyof typeof permissions];
      return resourcePermissions && (resourcePermissions as any)[action] === true;
    });
    if (!hasAllPermissions) {
      return false;
    }
  }

  return true;
};

// Keep your existing MenuItemComponent unchanged...
interface MenuItemComponentProps {
  item: MenuItem;
  isActive: boolean;
  hasChildren: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onClose: () => void;
}

const MenuItemComponent: React.FC<MenuItemComponentProps> = ({
  item,
  isActive,
  hasChildren,
  isExpanded,
  onToggle,
  onClose
}) => {
  const baseClasses = "flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors duration-150 ease-in-out";
  const activeClasses = "bg-blue-100 text-blue-900";
  const inactiveClasses = "text-gray-600 hover:bg-gray-50 hover:text-gray-900";

  if (hasChildren) {
    return (
      <div>
        <button
          onClick={onToggle}
          className={`${baseClasses} w-full justify-between ${
            isActive ? activeClasses : inactiveClasses
          }`}
        >
          <div className="flex items-center">
            {item.icon}
            <span className="ml-3">{item.label}</span>
            {item.badge && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                {item.badge}
              </span>
            )}
          </div>
          <div className={`transform transition-transform duration-150 ${isExpanded ? 'rotate-90' : ''}`}>
            <Icons.ChevronRight />
          </div>
        </button>
      </div>
    );
  }

  return (
    <Link
      to={item.path}
      onClick={onClose}
      className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
    >
      {item.icon}
      <span className="ml-3">{item.label}</span>
      {item.badge && (
        <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
          {item.badge}
        </span>
      )}
    </Link>
  );
};

// =============================================================================
// MAIN COMPONENT - UPDATED WITH DYNAMIC LOGO
// =============================================================================

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, className = '' }) => {
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const currentUser = getUser();
  const { companySettings } = useCompany(); // Add this to get company data

  // Toggle expanded state for menu items with children
  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  // Check if current path matches item path - Updated for better matching
  const isItemActive = (item: MenuItem): boolean => {
    if (item.children) {
      return item.children.some(child => {
        if (child.path.includes('?')) {
          return location.pathname + location.search === child.path;
        }
        return location.pathname === child.path;
      });
    }
    
    if (item.path.includes('?')) {
      return location.pathname + location.search === item.path;
    }
    
    return location.pathname === item.path || location.pathname.startsWith(item.path + '/');
  };

  // Filter menu items based on user permissions
  const visibleMenuItems = menuItems.filter(canAccessMenuItem);

  // Auto-expand active parent items
  React.useEffect(() => {
    menuItems.forEach(item => {
      if (item.children && item.children.some(child => {
        if (child.path.includes('?')) {
          return location.pathname + location.search === child.path;
        }
        return location.pathname === child.path || location.pathname.startsWith(child.path + '/');
      })) {
        if (!expandedItems.includes(item.id)) {
          setExpandedItems(prev => [...prev, item.id]);
        }
      }
    });
  }, [location.pathname, location.search]);

  // Get dynamic company name
  const companyName = companySettings?.name || 'QuoteFlow';

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          ${className}
        `}
      >
        <div className="flex flex-col h-full">
          {/* UPDATED: Sidebar header with dynamic logo and company name */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <SidebarCompanyLogo className="w-8 h-8" />
              </div>
              <div className="ml-3">
                <h2 className="text-lg font-semibold text-gray-900">{companyName}</h2>
                <p className="text-xs text-gray-500">Quotation Management</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* User info */}
          {currentUser && (
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-700">
                      {currentUser.firstName[0]}{currentUser.lastName[0]}
                    </span>
                  </div>
                </div>
                <div className="ml-3 min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {getUserDisplayName(currentUser)}
                  </p>
                  {/* <p className="text-xs text-gray-500 truncate">{currentUser.role}</p> */}
                </div>
              </div>
            </div>
          )}

          {/* Navigation - Keep this section unchanged */}
          <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
            {visibleMenuItems.map((item) => {
              const isActive = isItemActive(item);
              const hasChildren = item.children && item.children.length > 0;
              const isExpanded = expandedItems.includes(item.id);
              const visibleChildren = hasChildren ? item.children!.filter(canAccessMenuItem) : [];

              return (
                <div key={item.id}>
                  <MenuItemComponent
                    item={item}
                    isActive={isActive}
                    hasChildren={Boolean(hasChildren && visibleChildren.length > 0)}
                    isExpanded={isExpanded}
                    onToggle={() => toggleExpanded(item.id)}
                    onClose={onClose}
                  />
                  
                  {hasChildren && isExpanded && visibleChildren.length > 0 && (
                    <div className="ml-4 mt-1 space-y-1">
                      {visibleChildren.map((child) => {
                        const isChildActive = child.path.includes('?') 
                          ? location.pathname + location.search === child.path
                          : location.pathname === child.path || location.pathname.startsWith(child.path + '/');
                          
                        return (
                          <Link
                            key={child.id}
                            to={child.path}
                            onClick={onClose}
                            className={`flex items-center px-4 py-2 text-sm rounded-md transition-colors duration-150 ease-in-out ${
                              isChildActive
                                ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                          >
                            <div className="w-4 h-4 mr-3 flex items-center justify-center">
                              <div className={`w-1.5 h-1.5 rounded-full ${
                                isChildActive ? 'bg-blue-600' : 'bg-gray-400'
                              }`} />
                            </div>
                            <span>{child.label}</span>
                            {child.badge && (
                              <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                {child.badge}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* UPDATED: Sidebar footer with dynamic company name */}
          <div className="px-4 py-4 border-t border-gray-200">
            <div className="text-xs text-gray-500 text-center">
              <p>{companyName} v1.0.0</p>
              <p>© 2024 {companyName}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;