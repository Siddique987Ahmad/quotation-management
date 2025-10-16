// import React, { useState, useEffect } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { authAPI } from '../services/api';
// import { useCompany } from '../contexts/CompanyContext';
// import LoadingSpinner, { ButtonSpinner } from '../components/LoadingSpinner';

// // =============================================================================
// // TYPES
// // =============================================================================

// interface UserProfile {
//   id: string;
//   email: string;
//   firstName: string;
//   lastName: string;
//   role: string;
//   isActive: boolean;
//   createdAt: string;
//   updatedAt: string;
//   statistics: {
//     totalQuotations: number;
//     totalInvoices: number;
//   };
// }

// interface ProfilePageState {
//   user: UserProfile | null;
//   isLoading: boolean;
//   error: string | null;
//   isEditing: boolean;
//   editForm: {
//     firstName: string;
//     lastName: string;
//     email: string;
//   };
//   isSaving: boolean;
// }

// // =============================================================================
// // PROFILE AVATAR COMPONENT
// // =============================================================================

// const ProfileAvatar: React.FC<{ user: UserProfile; className?: string }> = ({ 
//   user, 
//   className = "w-24 h-24" 
// }) => {
//   const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  
//   return (
//     <div className={`${className} rounded-full bg-blue-600 flex items-center justify-center shadow-lg`}>
//       <span className="text-white font-bold text-2xl">{initials}</span>
//     </div>
//   );
// };

// // =============================================================================
// // STATISTICS CARD COMPONENT
// // =============================================================================

// const StatCard: React.FC<{ 
//   title: string; 
//   value: number; 
//   icon: React.ReactNode;
//   color: string;
// }> = ({ title, value, icon, color }) => {
//   return (
//     <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
//       <div className="flex items-center">
//         <div className={`${color} p-3 rounded-lg`}>
//           {icon}
//         </div>
//         <div className="ml-4">
//           <p className="text-sm font-medium text-gray-600">{title}</p>
//           <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
//         </div>
//       </div>
//     </div>
//   );
// };

// // =============================================================================
// // MAIN COMPONENT
// // =============================================================================

// const ProfilePage: React.FC = () => {
//   const navigate = useNavigate();
//   const { companySettings } = useCompany();
  
//   const [state, setState] = useState<ProfilePageState>({
//     user: null,
//     isLoading: true,
//     error: null,
//     isEditing: false,
//     editForm: {
//       firstName: '',
//       lastName: '',
//       email: ''
//     },
//     isSaving: false
//   });

//   // Fetch user profile data
//   const fetchProfile = async () => {
//     try {
//       setState(prev => ({ ...prev, isLoading: true, error: null }));
      
//       const response = await authAPI.getProfile();
      
//       if (response.data.success && response.data.data) {
//         const userData = response.data.data.user as UserProfile;
//         setState(prev => ({
//           ...prev,
//           user: userData,
//           editForm: {
//             firstName: userData.firstName,
//             lastName: userData.lastName,
//             email: userData.email
//           },
//           isLoading: false
//         }));
//       } else {
//         setState(prev => ({
//           ...prev,
//           error: response.data.message || 'Failed to load profile',
//           isLoading: false
//         }));
//       }
//     } catch (error: any) {
//       let errorMessage = 'Failed to load profile. Please try again.';
      
//       if (error.response?.status === 401) {
//         navigate('/login?reason=session_expired');
//         return;
//       } else if (error.response?.data?.message) {
//         errorMessage = error.response.data.message;
//       } else if (error.response?.status >= 500) {
//         errorMessage = 'Server error. Please try again later.';
//       }

//       setState(prev => ({
//         ...prev,
//         error: errorMessage,
//         isLoading: false
//       }));
//     }
//   };

//   // Load profile on component mount
//   useEffect(() => {
//     fetchProfile();
//   }, []);

//   // Handle edit mode toggle
//   const toggleEditMode = () => {
//     if (state.isEditing && state.user) {
//       // Reset form to original values when canceling
//       setState(prev => ({
//         ...prev,
//         isEditing: false,
//         editForm: {
//           firstName: state.user!.firstName,
//           lastName: state.user!.lastName,
//           email: state.user!.email
//         }
//       }));
//     } else {
//       setState(prev => ({ ...prev, isEditing: true }));
//     }
//   };

//   // Handle form input changes
//   const handleInputChange = (field: keyof typeof state.editForm) => (
//     e: React.ChangeEvent<HTMLInputElement>
//   ) => {
//     setState(prev => ({
//       ...prev,
//       editForm: {
//         ...prev.editForm,
//         [field]: e.target.value
//       }
//     }));
//   };

//   // Handle profile update
//   const handleSaveProfile = async (e: React.FormEvent) => {
//     e.preventDefault();
    
//     setState(prev => ({ ...prev, isSaving: true }));
    
//     try {
//       const response = await authAPI.updateProfile(state.editForm);
      
//       if (response.data.success) {
//         // Refresh profile data
//         await fetchProfile();
//         setState(prev => ({ ...prev, isEditing: false, isSaving: false }));
//       } else {
//         setState(prev => ({
//           ...prev,
//           error: response.data.message || 'Failed to update profile',
//           isSaving: false
//         }));
//       }
//     } catch (error: any) {
//       let errorMessage = 'Failed to update profile. Please try again.';
      
//       if (error.response?.data?.message) {
//         errorMessage = error.response.data.message;
//       }

//       setState(prev => ({
//         ...prev,
//         error: errorMessage,
//         isSaving: false
//       }));
//     }
//   };

//   // Format date helper
//   const formatDate = (dateString: string) => {
//     return new Date(dateString).toLocaleDateString('en-US', {
//       year: 'numeric',
//       month: 'long',
//       day: 'numeric'
//     });
//   };

//   // Loading state
//   if (state.isLoading) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//         <LoadingSpinner text="Loading profile..." />
//       </div>
//     );
//   }

//   // Error state
//   if (state.error && !state.user) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//         <div className="max-w-md w-full">
//           <div className="bg-white shadow-lg rounded-lg p-6 text-center">
//             <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
//               <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
//               </svg>
//             </div>
//             <h3 className="mt-4 text-lg font-medium text-gray-900">Failed to Load Profile</h3>
//             <p className="mt-2 text-sm text-gray-500">{state.error}</p>
//             <div className="mt-6">
//               <button
//                 onClick={fetchProfile}
//                 className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
//               >
//                 Retry
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   if (!state.user) return null;

//   const companyName = companySettings?.name || 'QuoteFlow';

//   return (
//     <div className="min-h-screen bg-gray-50">
//       {/* Header */}
//       <div className="bg-white shadow">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="flex justify-between items-center py-6">
//             <div className="flex items-center">
//               <Link
//                 to="/dashboard"
//                 className="text-blue-600 hover:text-blue-800 flex items-center"
//               >
//                 <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
//                 </svg>
//                 Back to Dashboard
//               </Link>
//             </div>
//             <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
//             <div></div>
//           </div>
//         </div>
//       </div>

//       <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
//         {/* Error Alert */}
//         {state.error && (
//           <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
//             <div className="flex">
//               <div className="flex-shrink-0">
//                 <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
//                   <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
//                 </svg>
//               </div>
//               <div className="ml-3">
//                 <p className="text-sm">{state.error}</p>
//               </div>
//               <div className="ml-auto pl-3">
//                 <div className="-mx-1.5 -my-1.5">
//                   <button
//                     onClick={() => setState(prev => ({ ...prev, error: null }))}
//                     className="inline-flex rounded-md p-1.5 text-red-500 hover:bg-red-100"
//                   >
//                     <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
//                       <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
//                     </svg>
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}

//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//           {/* Profile Information Card */}
//           <div className="lg:col-span-2">
//             <div className="bg-white shadow rounded-lg">
//               <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
//                 <h2 className="text-lg font-medium text-gray-900">Profile Information</h2>
//                 <button
//                   onClick={toggleEditMode}
//                   disabled={state.isSaving}
//                   className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
//                 >
//                   {state.isEditing ? 'Cancel' : 'Edit Profile'}
//                 </button>
//               </div>
              
//               <div className="px-6 py-6">
//                 {state.isEditing ? (
//                   <form onSubmit={handleSaveProfile} className="space-y-4">
//                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                       <div>
//                         <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
//                           First Name
//                         </label>
//                         <input
//                           type="text"
//                           id="firstName"
//                           required
//                           value={state.editForm.firstName}
//                           onChange={handleInputChange('firstName')}
//                           className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
//                         />
//                       </div>
                      
//                       <div>
//                         <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
//                           Last Name
//                         </label>
//                         <input
//                           type="text"
//                           id="lastName"
//                           required
//                           value={state.editForm.lastName}
//                           onChange={handleInputChange('lastName')}
//                           className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
//                         />
//                       </div>
//                     </div>
                    
//                     <div>
//                       <label htmlFor="email" className="block text-sm font-medium text-gray-700">
//                         Email Address
//                       </label>
//                       <input
//                         type="email"
//                         id="email"
//                         required
//                         value={state.editForm.email}
//                         onChange={handleInputChange('email')}
//                         className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
//                       />
//                     </div>
                    
//                     <div className="flex justify-end space-x-3 pt-4">
//                       <button
//                         type="button"
//                         onClick={toggleEditMode}
//                         disabled={state.isSaving}
//                         className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
//                       >
//                         Cancel
//                       </button>
//                       <button
//                         type="submit"
//                         disabled={state.isSaving}
//                         className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400"
//                       >
//                         {state.isSaving && <ButtonSpinner />}
//                         Save Changes
//                       </button>
//                     </div>
//                   </form>
//                 ) : (
//                   <div className="space-y-4">
//                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                       <div>
//                         <dt className="text-sm font-medium text-gray-500">First Name</dt>
//                         <dd className="mt-1 text-sm text-gray-900">{state.user.firstName}</dd>
//                       </div>
                      
//                       <div>
//                         <dt className="text-sm font-medium text-gray-500">Last Name</dt>
//                         <dd className="mt-1 text-sm text-gray-900">{state.user.lastName}</dd>
//                       </div>
//                     </div>
                    
//                     <div>
//                       <dt className="text-sm font-medium text-gray-500">Email Address</dt>
//                       <dd className="mt-1 text-sm text-gray-900">{state.user.email}</dd>
//                     </div>
                    
//                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                       <div>
//                         <dt className="text-sm font-medium text-gray-500">Role</dt>
//                         <dd className="mt-1">
//                           <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
//                             {state.user.role.replace('_', ' ')}
//                           </span>
//                         </dd>
//                       </div>
                      
//                       <div>
//                         <dt className="text-sm font-medium text-gray-500">Status</dt>
//                         <dd className="mt-1">
//                           <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
//                             state.user.isActive 
//                               ? 'bg-green-100 text-green-800' 
//                               : 'bg-red-100 text-red-800'
//                           }`}>
//                             {state.user.isActive ? 'Active' : 'Inactive'}
//                           </span>
//                         </dd>
//                       </div>
//                     </div>
                    
//                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                       <div>
//                         <dt className="text-sm font-medium text-gray-500">Member Since</dt>
//                         <dd className="mt-1 text-sm text-gray-900">{formatDate(state.user.createdAt)}</dd>
//                       </div>
                      
//                       <div>
//                         <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
//                         <dd className="mt-1 text-sm text-gray-900">{formatDate(state.user.updatedAt)}</dd>
//                       </div>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>

//           {/* Sidebar */}
//           <div className="space-y-8">
//             {/* Profile Avatar */}
//             <div className="bg-white shadow rounded-lg p-6">
//               <div className="text-center">
//                 <ProfileAvatar user={state.user} className="w-24 h-24 mx-auto" />
//                 <h3 className="mt-4 text-lg font-medium text-gray-900">
//                   {state.user.firstName} {state.user.lastName}
//                 </h3>
//                 <p className="text-sm text-gray-500 capitalize">{state.user.role.replace('_', ' ')}</p>
//               </div>
//             </div>

//             {/* Statistics */}
//             <div className="space-y-4">
//               <h3 className="text-lg font-medium text-gray-900">Statistics</h3>
              
//               <StatCard
//                 title="Total Quotations"
//                 value={state.user.statistics.totalQuotations}
//                 color="bg-blue-100"
//                 icon={
//                   <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
//                   </svg>
//                 }
//               />
              
//               <StatCard
//                 title="Total Invoices"
//                 value={state.user.statistics.totalInvoices}
//                 color="bg-green-100"
//                 icon={
//                   <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
//                   </svg>
//                 }
//               />
//             </div>

//             {/* Quick Actions */}
//             <div className="bg-white shadow rounded-lg p-6">
//               <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
//               <div className="space-y-3">
//                 <Link
//                   to="/forgot-password"
//                   className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
//                 >
//                   Change Password
//                 </Link>
//                 <Link
//                   to="/quotations"
//                   className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
//                 >
//                   View Quotations
//                 </Link>
//                 <Link
//                   to="/invoices"
//                   className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
//                 >
//                   View Invoices
//                 </Link>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ProfilePage;



import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useCompany } from '../contexts/CompanyContext';
import LoadingSpinner, { ButtonSpinner } from '../components/LoadingSpinner';

// =============================================================================
// TYPES
// =============================================================================

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  statistics: {
    totalQuotations: number;
    totalInvoices: number;
  };
}

interface ProfilePageState {
  user: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  isEditing: boolean;
  editForm: {
    firstName: string;
    lastName: string;
  };
  isSaving: boolean;
}

interface PasswordModalState {
  isOpen: boolean;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  isSubmitting: boolean;
  error: string | null;
  success: boolean;
}

// =============================================================================
// PROFILE AVATAR COMPONENT
// =============================================================================

const ProfileAvatar: React.FC<{ user: UserProfile; className?: string }> = ({ 
  user, 
  className = "w-24 h-24" 
}) => {
  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  
  return (
    <div className={`${className} rounded-full bg-blue-600 flex items-center justify-center shadow-lg`}>
      <span className="text-white font-bold text-2xl">{initials}</span>
    </div>
  );
};

// =============================================================================
// STATISTICS CARD COMPONENT
// =============================================================================

const StatCard: React.FC<{ 
  title: string; 
  value: number; 
  icon: React.ReactNode;
  color: string;
}> = ({ title, value, icon, color }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
      <div className="flex items-center">
        <div className={`${color} p-3 rounded-lg`}>
          {icon}
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// CHANGE PASSWORD MODAL COMPONENT
// =============================================================================

// const ChangePasswordModal: React.FC<{
//   isOpen: boolean;
//   onClose: () => void;
// }> = ({ isOpen, onClose }) => {
//   const [modalState, setModalState] = useState<PasswordModalState>({
//     isOpen: false,
//     currentPassword: '',
//     newPassword: '',
//     confirmPassword: '',
//     isSubmitting: false,
//     error: null,
//     success: false
//   });

//   const handleInputChange = (field: keyof Pick<PasswordModalState, 'currentPassword' | 'newPassword' | 'confirmPassword'>) => (
//     e: React.ChangeEvent<HTMLInputElement>
//   ) => {
//     setModalState(prev => ({
//       ...prev,
//       [field]: e.target.value,
//       error: null
//     }));
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
    
//     // Client-side validation
//     if (modalState.newPassword !== modalState.confirmPassword) {
//       setModalState(prev => ({ ...prev, error: 'Password confirmation does not match new password' }));
//       return;
//     }

//     if (modalState.newPassword === modalState.currentPassword) {
//       setModalState(prev => ({ ...prev, error: 'New password must be different from current password' }));
//       return;
//     }

//     if (modalState.newPassword.length < 6) {
//       setModalState(prev => ({ ...prev, error: 'New password must be at least 6 characters long' }));
//       return;
//     }

//     setModalState(prev => ({ ...prev, isSubmitting: true, error: null }));

//     try {
//       const response = await authAPI.changePassword({
//         currentPassword: modalState.currentPassword,
//         newPassword: modalState.newPassword,
//         confirmPassword: modalState.confirmPassword
//       });

//       if (response.data.success) {
//         setModalState(prev => ({ ...prev, success: true, isSubmitting: false }));
        
//         // Close modal after 2 seconds
//         setTimeout(() => {
//           handleClose();
//         }, 2000);
//       } else {
//         setModalState(prev => ({
//           ...prev,
//           error: response.data.message || 'Failed to change password',
//           isSubmitting: false
//         }));
//       }
//     } catch (error: any) {
//       let errorMessage = 'Failed to change password. Please try again.';
      
//       if (error.response?.data?.message) {
//         errorMessage = error.response.data.message;
//       } else if (error.response?.data?.error) {
//         errorMessage = error.response.data.error;
//       }

//       setModalState(prev => ({
//         ...prev,
//         error: errorMessage,
//         isSubmitting: false
//       }));
//     }
//   };

//   const handleClose = () => {
//     setModalState({
//       isOpen: false,
//       currentPassword: '',
//       newPassword: '',
//       confirmPassword: '',
//       isSubmitting: false,
//       error: null,
//       success: false
//     });
//     onClose();
//   };

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 z-50 overflow-y-auto">
//       <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
//         {/* Background overlay */}
//         <div 
//           className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
//           onClick={handleClose}
//         ></div>

//         {/* Modal panel */}
//         <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
//           <form onSubmit={handleSubmit}>
//             <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
//               <div className="sm:flex sm:items-start">
//                 <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
//                   <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
//                   </svg>
//                 </div>
//                 <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
//                   <h3 className="text-lg leading-6 font-medium text-gray-900">
//                     Change Password
//                   </h3>
//                   <div className="mt-4 space-y-4">
//                     {modalState.error && (
//                       <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
//                         {modalState.error}
//                       </div>
//                     )}
                    
//                     {modalState.success && (
//                       <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-md text-sm">
//                         Password changed successfully! Closing...
//                       </div>
//                     )}

//                     <div>
//                       <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
//                         Current Password
//                       </label>
//                       <input
//                         type="password"
//                         id="currentPassword"
//                         required
//                         disabled={modalState.success}
//                         value={modalState.currentPassword}
//                         onChange={handleInputChange('currentPassword')}
//                         className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
//                       />
//                     </div>

//                     <div>
//                       <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
//                         New Password
//                       </label>
//                       <input
//                         type="password"
//                         id="newPassword"
//                         required
//                         disabled={modalState.success}
//                         value={modalState.newPassword}
//                         onChange={handleInputChange('newPassword')}
//                         className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
//                         minLength={6}
//                       />
//                       <p className="mt-1 text-xs text-gray-500">Must be at least 6 characters</p>
//                     </div>

//                     <div>
//                       <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
//                         Confirm New Password
//                       </label>
//                       <input
//                         type="password"
//                         id="confirmPassword"
//                         required
//                         disabled={modalState.success}
//                         value={modalState.confirmPassword}
//                         onChange={handleInputChange('confirmPassword')}
//                         className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
//                       />
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//             <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
//               <button
//                 type="submit"
//                 disabled={modalState.isSubmitting || modalState.success}
//                 className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:bg-blue-400"
//               >
//                 {modalState.isSubmitting && <ButtonSpinner />}
//                 {modalState.success ? 'Success!' : 'Change Password'}
//               </button>
//               <button
//                 type="button"
//                 onClick={handleClose}
//                 disabled={modalState.isSubmitting}
//                 className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
//               >
//                 Cancel
//               </button>
//             </div>
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// };


// Add this interface at the top with other types
interface PasswordModalState {
  isOpen: boolean;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  isSubmitting: boolean;
  error: string | null;
  success: boolean;
  showCurrentPassword: boolean;
  showNewPassword: boolean;
  showConfirmPassword: boolean;
}

// =============================================================================
// CHANGE PASSWORD MODAL COMPONENT WITH SHOW/HIDE & REAL-TIME VALIDATION
// =============================================================================

const ChangePasswordModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const [modalState, setModalState] = useState<PasswordModalState>({
    isOpen: false,
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    isSubmitting: false,
    error: null,
    success: false,
    showCurrentPassword: false,
    showNewPassword: false,
    showConfirmPassword: false
  });

  const handleInputChange =(field: keyof Pick<PasswordModalState, 'currentPassword' | 'newPassword' | 'confirmPassword'>) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setModalState(prev => ({
      ...prev,
      [field]: e.target.value,
      error: null
    }));
  };

  const togglePasswordVisibility = (field: 'showCurrentPassword' | 'showNewPassword' | 'showConfirmPassword') => {
    setModalState(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // Check if passwords match in real-time
  const passwordsMatch = modalState.newPassword === modalState.confirmPassword;
  const showPasswordMismatch = modalState.confirmPassword.length > 0 && !passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side validation
    if (modalState.newPassword !== modalState.confirmPassword) {
      setModalState(prev => ({ ...prev, error: 'Password confirmation does not match new password' }));
      return;
    }

    if (modalState.newPassword === modalState.currentPassword) {
      setModalState(prev => ({ ...prev, error: 'New password must be different from current password' }));
      return;
    }

    if (modalState.newPassword.length < 6) {
      setModalState(prev => ({ ...prev, error: 'New password must be at least 6 characters long' }));
      return;
    }

    setModalState(prev => ({ ...prev, isSubmitting: true, error: null }));

    try {
      const response = await authAPI.changePassword({
        currentPassword: modalState.currentPassword,
        newPassword: modalState.newPassword,
        confirmPassword: modalState.confirmPassword
      });

      if (response.data.success) {
        setModalState(prev => ({ ...prev, success: true, isSubmitting: false }));
        
        // Close modal after 2 seconds
        setTimeout(() => {
          handleClose();
        }, 2000);
      } else {
        setModalState(prev => ({
          ...prev,
          error: response.data.message || 'Failed to change password',
          isSubmitting: false
        }));
      }
    } catch (error: any) {
      let errorMessage = 'Failed to change password. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }

      setModalState(prev => ({
        ...prev,
        error: errorMessage,
        isSubmitting: false
      }));
    }
  };

  const handleClose = () => {
    setModalState({
      isOpen: false,
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      isSubmitting: false,
      error: null,
      success: false,
      showCurrentPassword: false,
      showNewPassword: false,
      showConfirmPassword: false
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={handleClose}
        ></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                  <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Change Password
                  </h3>
                  <div className="mt-4 space-y-4">
                    {modalState.error && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
                        {modalState.error}
                      </div>
                    )}
                    
                    {modalState.success && (
                      <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-md text-sm">
                        Password changed successfully! Closing...
                      </div>
                    )}

                    {/* Current Password */}
                    <div>
                      <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                        Current Password
                      </label>
                      <div className="mt-1 relative">
                        <input
                          type={modalState.showCurrentPassword ? "text" : "password"}
                          id="currentPassword"
                          required
                          disabled={modalState.success}
                          value={modalState.currentPassword}
                          onChange={handleInputChange('currentPassword')}
                          className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 pr-10 focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('showCurrentPassword')}
                          disabled={modalState.success}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                        >
                          {modalState.showCurrentPassword ? (
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
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

                    {/* New Password */}
                    <div>
                      <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                        New Password
                      </label>
                      <div className="mt-1 relative">
                        <input
                          type={modalState.showNewPassword ? "text" : "password"}
                          id="newPassword"
                          required
                          disabled={modalState.success}
                          value={modalState.newPassword}
                          onChange={handleInputChange('newPassword')}
                          className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 pr-10 focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('showNewPassword')}
                          disabled={modalState.success}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                        >
                          {modalState.showNewPassword ? (
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                          ) : (
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">Must be at least 6 characters</p>
                    </div>

                    {/* Confirm New Password */}
                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                        Confirm New Password
                      </label>
                      <div className="mt-1 relative">
                        <input
                          type={modalState.showConfirmPassword ? "text" : "password"}
                          id="confirmPassword"
                          required
                          disabled={modalState.success}
                          value={modalState.confirmPassword}
                          onChange={handleInputChange('confirmPassword')}
                          className={`block w-full border rounded-md shadow-sm py-2 px-3 pr-10 focus:outline-none disabled:bg-gray-100 ${
                            showPasswordMismatch 
                              ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                              : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('showConfirmPassword')}
                          disabled={modalState.success}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                        >
                          {modalState.showConfirmPassword ? (
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                          ) : (
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      </div>
                      {/* Real-time password mismatch warning */}
                      {showPasswordMismatch && (
                        <p className="mt-1 text-xs text-red-600 flex items-center">
                          <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          Passwords do not match
                        </p>
                      )}
                      {/* Success indicator when passwords match */}
                      {modalState.confirmPassword.length > 0 && passwordsMatch && (
                        <p className="mt-1 text-xs text-green-600 flex items-center">
                          <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Passwords match
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={modalState.isSubmitting || modalState.success}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:bg-blue-400"
              >
                {modalState.isSubmitting && <ButtonSpinner />}
                {modalState.success ? 'Success!' : 'Change Password'}
              </button>
              <button
                type="button"
                onClick={handleClose}
                disabled={modalState.isSubmitting}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { companySettings } = useCompany();
  
  const [state, setState] = useState<ProfilePageState>({
    user: null,
    isLoading: true,
    error: null,
    isEditing: false,
    editForm: {
      firstName: '',
      lastName: ''
    },
    isSaving: false
  });

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // Check if user can edit profile (not super_admin or admin)
  // const canEditProfile = state.user && state.user.role !== 'SUPER_ADMIN' && state.user.role !== 'ADMIN';

  // Fetch user profile data
  const fetchProfile = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await authAPI.getProfile();
      
      if (response.data.success && response.data.data) {
        const userData = response.data.data.user as UserProfile;
        setState(prev => ({
          ...prev,
          user: userData,
          editForm: {
            firstName: userData.firstName,
            lastName: userData.lastName
          },
          isLoading: false
        }));
      } else {
        setState(prev => ({
          ...prev,
          error: response.data.message || 'Failed to load profile',
          isLoading: false
        }));
      }
    } catch (error: any) {
      let errorMessage = 'Failed to load profile. Please try again.';
      
      if (error.response?.status === 401) {
        navigate('/login?reason=session_expired');
        return;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
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

  // Load profile on component mount
  useEffect(() => {
    fetchProfile();
  }, []);

  // Handle edit mode toggle
  const toggleEditMode = () => {
    if (state.isEditing && state.user) {
      // Reset form to original values when canceling
      setState(prev => ({
        ...prev,
        isEditing: false,
        editForm: {
          firstName: state.user!.firstName,
          lastName: state.user!.lastName
        }
      }));
    } else {
      setState(prev => ({ ...prev, isEditing: true }));
    }
  };

  // Handle form input changes
  const handleInputChange = (field: keyof typeof state.editForm) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setState(prev => ({
      ...prev,
      editForm: {
        ...prev.editForm,
        [field]: e.target.value
      }
    }));
  };

  // Handle profile update (only firstName and lastName)
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setState(prev => ({ ...prev, isSaving: true }));
    
    try {
      // Include email in the request to satisfy backend validation
      const updateData = {
        firstName: state.editForm.firstName,
        lastName: state.editForm.lastName,
        email: state.user?.email // Include current email (read-only)
      };
      
      console.log('Updating profile with data:', updateData); // Debug log
      
      const response = await authAPI.updateProfile(updateData);
      
      console.log('Update profile response:', response.data); // Debug log
      
      if (response.data.success) {
        // Refresh profile data
        await fetchProfile();
        setState(prev => ({ ...prev, isEditing: false, isSaving: false }));
        console.log('Profile updated successfully'); // Debug log
      } else {
        console.error('Update profile failed:', response.data.message); // Debug log
        setState(prev => ({
          ...prev,
          error: response.data.message || 'Failed to update profile',
          isSaving: false
        }));
      }
    } catch (error: any) {
      console.error('Profile update error:', error); // Debug log
      let errorMessage = 'Failed to update profile. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      setState(prev => ({
        ...prev,
        error: errorMessage,
        isSaving: false
      }));
    }
  };

  // Format date helper
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Loading state
  if (state.isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner text="Loading profile..." />
      </div>
    );
  }

  // Error state
  if (state.error && !state.user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full">
          <div className="bg-white shadow-lg rounded-lg p-6 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Failed to Load Profile</h3>
            <p className="mt-2 text-sm text-gray-500">{state.error}</p>
            <div className="mt-6">
              <button
                onClick={fetchProfile}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!state.user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />

      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link
                to="/dashboard"
                className="text-blue-600 hover:text-blue-800 flex items-center"
              >
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Dashboard
              </Link>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
            <div></div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Error Alert */}
        {state.error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm">{state.error}</p>
              </div>
              <div className="ml-auto pl-3">
                <div className="-mx-1.5 -my-1.5">
                  <button
                    onClick={() => setState(prev => ({ ...prev, error: null }))}
                    className="inline-flex rounded-md p-1.5 text-red-500 hover:bg-red-100"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Information Card */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">Profile Information</h2>
                {/* {canEditProfile && ( */}
                  <button
                    onClick={toggleEditMode}
                    disabled={state.isSaving}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {state.isEditing ? 'Cancel' : 'Edit Profile'}
                  </button>
                {/* )} */}
              </div>
              
              <div className="px-6 py-6">
                {state.isEditing ? (
                  <form onSubmit={handleSaveProfile} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                          First Name
                        </label>
                        <input
                          type="text"
                          id="firstName"
                          required
                          value={state.editForm.firstName}
                          onChange={handleInputChange('firstName')}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                          Last Name
                        </label>
                        <input
                          type="text"
                          id="lastName"
                          required
                          value={state.editForm.lastName}
                          onChange={handleInputChange('lastName')}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Email Address
                      </label>
                      <input
                        type="email"
                        id="email"
                        disabled
                        value={state.user.email}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100 text-gray-500 cursor-not-allowed"
                      />
                      <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
                    </div>
                    
                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={toggleEditMode}
                        disabled={state.isSaving}
                        className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={state.isSaving}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400"
                      >
                        {state.isSaving && <ButtonSpinner />}
                        Save Changes
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">First Name</dt>
                        <dd className="mt-1 text-sm text-gray-900">{state.user.firstName}</dd>
                      </div>
                      
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Last Name</dt>
                        <dd className="mt-1 text-sm text-gray-900">{state.user.lastName}</dd>
                      </div>
                    </div>
                    
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Email Address</dt>
                      <dd className="mt-1 text-sm text-gray-900">{state.user.email}</dd>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Role</dt>
                        <dd className="mt-1">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                            {state.user.role.replace('_', ' ')}
                          </span>
                        </dd>
                      </div>
                      
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Status</dt>
                        <dd className="mt-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            state.user.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {state.user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </dd>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Member Since</dt>
                        <dd className="mt-1 text-sm text-gray-900">{formatDate(state.user.createdAt)}</dd>
                      </div>
                      
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                        <dd className="mt-1 text-sm text-gray-900">{formatDate(state.user.updatedAt)}</dd>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Profile Avatar */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="text-center">
                <ProfileAvatar user={state.user} className="w-24 h-24 mx-auto" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  {state.user.firstName} {state.user.lastName}
                </h3>
                <p className="text-sm text-gray-500 capitalize">{state.user.role.replace('_', ' ')}</p>
              </div>
            </div>

            {/* Statistics */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Statistics</h3>
              
              <StatCard
                title="Total Quotations"
                value={state.user.statistics.totalQuotations}
                color="bg-blue-100"
                icon={
                  <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                }
              />
              
              <StatCard
                title="Total Invoices"
                value={state.user.statistics.totalInvoices}
                color="bg-green-100"
                icon={
                  <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                }
              />
            </div>

            {/* Quick Actions */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => setIsPasswordModalOpen(true)}
                  className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                >
                  Change Password
                </button>
                <Link
                  to="/quotations"
                  className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                >
                  View Quotations
                </Link>
                <Link
                  to="/invoices"
                  className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                >
                  View Invoices
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;