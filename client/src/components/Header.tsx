// import React, { useState, useRef, useEffect } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { 
//   getUser, 
//   getUserDisplayName, 
//   getUserInitials, 
//   getRoleDisplayName,
//   handleLogout,
//    hasRoleOrHigher,  // Add this import
//   canAccessAdmin
// } from '../utils/auth';
// import { User,Role } from '../types';

// // =============================================================================
// // TYPES
// // =============================================================================

// interface HeaderProps {
//   onToggleSidebar: () => void;
//   className?: string;
// }

// interface NotificationProps {
//   id: string;
//   title: string;
//   message: string;
//   time: string;
//   isRead: boolean;
//   type: 'info' | 'warning' | 'success' | 'error';
// }

// // =============================================================================
// // ICONS
// // =============================================================================

// const Icons = {
//   Menu: () => (
//     <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
//     </svg>
//   ),
//   Search: () => (
//     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
//     </svg>
//   ),
//   ChevronDown: () => (
//     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
//     </svg>
//   ),
//   User: () => (
//     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
//     </svg>
//   ),
//   Settings: () => (
//     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
//       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
//     </svg>
//   ),
//   Logout: () => (
//     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
//     </svg>
//   ),
//   Close: () => (
//     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//     </svg>
//   )
// };
// // =============================================================================
// // COMPONENTS
// // =============================================================================

// interface SearchBoxProps {
//   onSearch: (query: string) => void;
// }

// const SearchBox: React.FC<SearchBoxProps> = ({ onSearch }) => {
//   const [query, setQuery] = useState('');
//   const [isExpanded, setIsExpanded] = useState(false);

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     onSearch(query);
//     setIsExpanded(false);
//   };

//   return (
//     <div className="relative">
//       {isExpanded ? (
//         <form onSubmit={handleSubmit} className="flex items-center">
//           <div className="relative">
//             <input
//               type="text"
//               value={query}
//               onChange={(e) => setQuery(e.target.value)}
//               placeholder="Search quotations, invoices, clients..."
//               className="w-64 pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//               autoFocus
//             />
//             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//               <Icons.Search />
//             </div>
//           </div>
//           <button
//             type="button"
//             onClick={() => setIsExpanded(false)}
//             className="ml-2 p-2 text-gray-400 hover:text-gray-600"
//           >
//             <Icons.Close />
//           </button>
//         </form>
//       ) : (
//         <button
//           onClick={() => setIsExpanded(true)}
//           className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-150"
//         >
//           <Icons.Search />
//         </button>
//       )}
//     </div>
//   );
// };

// interface UserMenuProps {
//   user: User;
//   isOpen: boolean;
//   onClose: () => void;
// }

// const UserMenu: React.FC<UserMenuProps> = ({ user, isOpen, onClose }) => {
//   const navigate = useNavigate();
//   const menuRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
//         onClose();
//       }
//     };

//     if (isOpen) {
//       document.addEventListener('mousedown', handleClickOutside);
//     }

//     return () => {
//       document.removeEventListener('mousedown', handleClickOutside);
//     };
//   }, [isOpen, onClose]);

//   const handleLogoutClick = () => {
//     handleLogout();
//     navigate('/login');
//     onClose();
//   };

//   if (!isOpen) return null;

//     const canAccessSettings = hasRoleOrHigher(Role.ADMIN);

//   return (
//     <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50" ref={menuRef}>
//       {/* User info */}
//       <div className="px-4 py-3 border-b border-gray-200">
//         <p className="text-sm font-medium text-gray-900">{getUserDisplayName(user)}</p>
//         <p className="text-sm text-gray-500 truncate">{user.email}</p>
//         <p className="text-xs text-gray-400 mt-1">{getRoleDisplayName(user.role)}</p>
//       </div>

//       {/* Menu items */}
//       <div className="py-1">
//         <Link
//           to="/profile"
//           onClick={onClose}
//           className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
//         >
//           <Icons.User />
//           <span className="ml-3">Your Profile</span>
//         </Link>
//         {canAccessSettings && (
//           <Link
//             to="/settings/general"
//             onClick={onClose}
//             className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
//           >
//             <Icons.Settings />
//             <span className="ml-3">Settings</span>
//           </Link>
//         )}

//         <hr className="my-1 border-gray-200" />
        
//         <button
//           onClick={handleLogoutClick}
//           className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50 hover:text-red-900"
//         >
//           <Icons.Logout />
//           <span className="ml-3">Sign out</span>
//         </button>
//       </div>
//     </div>
//   );
// };

// // =============================================================================
// // MAIN COMPONENT
// // =============================================================================

// const Header: React.FC<HeaderProps> = ({ onToggleSidebar, className = '' }) => {
//   const [showNotifications, setShowNotifications] = useState(false);
//   const [showUserMenu, setShowUserMenu] = useState(false);
//   const currentUser = getUser();
  

//   const handleSearch = (query: string) => {
//     // TODO: Implement search functionality
//     console.log('Searching for:', query);
//   };

//   return (
//     <header className={`bg-white border-b border-gray-200 px-4 py-3 ${className}`}>
//       <div className="flex items-center justify-between">
//         {/* Left side - Menu button and search */}
//         <div className="flex items-center space-x-4">
//           <button
//             onClick={onToggleSidebar}
//             className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
//           >
//             <Icons.Menu />
//           </button>

//           {/* Search */}
//           <div className="hidden md:block">
//             <SearchBox onSearch={handleSearch} />
//           </div>
//         </div>

//         {/* Right side - Notifications and user menu */}
//         <div className="flex items-center space-x-3">
//           {/* Mobile search button */}
//           <div className="md:hidden">
//             <SearchBox onSearch={handleSearch} />
//           </div>
//           {/* User menu */}
//           {currentUser && (
//             <div className="relative">
//               <button
//                 onClick={() => {
//                   setShowUserMenu(!showUserMenu);
//                   setShowNotifications(false);
//                 }}
//                 className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors duration-150"
//               >
//                 <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
//                   <span className="text-sm font-medium text-white">
//                     {getUserInitials(currentUser)}
//                   </span>
//                 </div>
//                 <div className="hidden md:block text-left">
//                   <p className="text-sm font-medium text-gray-700">{getUserDisplayName(currentUser)}</p>
//                   <p className="text-xs text-gray-500">{getRoleDisplayName(currentUser.role)}</p>
//                 </div>
//                 <Icons.ChevronDown />
//               </button>
//               <UserMenu
//                 user={currentUser}
//                 isOpen={showUserMenu}
//                 onClose={() => setShowUserMenu(false)}
//               />
//             </div>
//           )}
//         </div>
//       </div>
//     </header>
//   );
// };

// export default Header;


import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  getUser, 
  getUserDisplayName, 
  getUserInitials, 
  getRoleDisplayName,
  handleLogout,
  hasRoleOrHigher,
  canAccessAdmin
} from '../utils/auth';
import { User, Role } from '../types';

// =============================================================================
// TYPES
// =============================================================================

interface HeaderProps {
  onToggleSidebar: () => void;
  className?: string;
}

interface NotificationProps {
  id: string;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  type: 'info' | 'warning' | 'success' | 'error';
}

// =============================================================================
// ICONS
// =============================================================================

const Icons = {
  Menu: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
  Search: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  ChevronDown: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  ),
  User: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  Settings: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Logout: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
  Close: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
};

// =============================================================================
// COMPONENTS
// =============================================================================

interface SearchBoxProps {
  onSearch: (query: string) => void;
}

const SearchBox: React.FC<SearchBoxProps> = ({ onSearch }) => {
  const [query, setQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
    setIsExpanded(false);
  };

  return (
    <div className="relative">
      {isExpanded ? (
        <form onSubmit={handleSubmit} className="flex items-center">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search quotations, invoices, clients..."
              className="w-64 pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Icons.Search />
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsExpanded(false)}
            className="ml-2 p-2 text-gray-400 hover:text-gray-600"
          >
            <Icons.Close />
          </button>
        </form>
      ) : (
        <button
          onClick={() => setIsExpanded(true)}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-150"
        >
          <Icons.Search />
        </button>
      )}
    </div>
  );
};

interface UserMenuProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  buttonRef: React.RefObject<HTMLButtonElement | null>;
}

const UserMenu: React.FC<UserMenuProps> = ({ user, isOpen, onClose, buttonRef }) => {
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if click is outside both menu AND button
      if (
        menuRef.current && 
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, buttonRef]);

  const handleLogoutClick = () => {
    handleLogout();
    navigate('/login');
    onClose();
  };

  if (!isOpen) return null;

  const canAccessSettings = hasRoleOrHigher(Role.ADMIN);

  return (
    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50" ref={menuRef}>
      {/* User info */}
      <div className="px-4 py-3 border-b border-gray-200">
        <p className="text-sm font-medium text-gray-900">{getUserDisplayName(user)}</p>
        <p className="text-sm text-gray-500 truncate">{user.email}</p>
        <p className="text-xs text-gray-400 mt-1">{getRoleDisplayName(user.role)}</p>
      </div>

      {/* Menu items */}
      <div className="py-1">
        <Link
          to="/profile"
          onClick={onClose}
          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
        >
          <Icons.User />
          <span className="ml-3">Your Profile</span>
        </Link>
        {canAccessSettings && (
          <Link
            to="/settings/general"
            onClick={onClose}
            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
          >
            <Icons.Settings />
            <span className="ml-3">Settings</span>
          </Link>
        )}

        <hr className="my-1 border-gray-200" />
        
        <button
          onClick={handleLogoutClick}
          className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50 hover:text-red-900"
        >
          <Icons.Logout />
          <span className="ml-3">Sign out</span>
        </button>
      </div>
    </div>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const Header: React.FC<HeaderProps> = ({ onToggleSidebar, className = '' }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const currentUser = getUser();
  const userButtonRef = useRef<HTMLButtonElement>(null);

  const handleSearch = (query: string) => {
    // TODO: Implement search functionality
    console.log('Searching for:', query);
  };

  return (
    <header className={`bg-white border-b border-gray-200 px-4 py-3 ${className}`}>
      <div className="flex items-center justify-between">
        {/* Left side - Menu button and search */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <Icons.Menu />
          </button>

          {/* Search */}
          <div className="hidden md:block">
            <SearchBox onSearch={handleSearch} />
          </div>
        </div>

        {/* Right side - Notifications and user menu */}
        <div className="flex items-center space-x-3">
          {/* Mobile search button */}
          <div className="md:hidden">
            <SearchBox onSearch={handleSearch} />
          </div>
          {/* User menu */}
          {currentUser && (
            <div className="relative">
              <button
                ref={userButtonRef}
                onClick={() => {
                  setShowUserMenu(!showUserMenu);
                  setShowNotifications(false);
                }}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors duration-150"
              >
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {getUserInitials(currentUser)}
                  </span>
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-700">{getUserDisplayName(currentUser)}</p>
                  <p className="text-xs text-gray-500">{getRoleDisplayName(currentUser.role)}</p>
                </div>
                <Icons.ChevronDown />
              </button>
              <UserMenu
                user={currentUser}
                isOpen={showUserMenu}
                onClose={() => setShowUserMenu(false)}
                buttonRef={userButtonRef}
              />
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;