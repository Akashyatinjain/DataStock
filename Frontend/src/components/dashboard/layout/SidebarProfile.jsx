// import { Settings, LogOut } from 'lucide-react';
// import { getAvatarUrl } from '../../../utils/fileHelpers';

// export default function SidebarProfile({ profile, onEditProfile, onLogout }) {
//   const displayName = profile?.name || 'User';
//   const displayEmail = profile?.email || '';

//   return (
//     <div className="border-t border-gray-200 p-4">
//       <div className="flex items-center gap-3">
//         <img
//           src={getAvatarUrl(profile)}
//           alt="profile"
//           className="w-11 h-11 rounded-full object-cover"
//         />
//         <div className="flex-1 min-w-0">
//           <h3 className="font-semibold text-sm text-gray-900 truncate">{displayName}</h3>
//           <p className="text-xs text-gray-500 truncate">{displayEmail}</p>
//         </div>
//         <button
//           onClick={onEditProfile}
//           className="p-2 hover:bg-gray-100 rounded-lg transition"
//           title="Edit profile"
//         >
//           <Settings className="w-4 h-4 text-gray-500" />
//         </button>
//       </div>

//       <button
//         onClick={onLogout}
//         className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gray-100 hover:bg-red-50 text-gray-700 hover:text-red-600 transition text-sm font-medium"
//       >
//         <LogOut className="w-4 h-4" />
//         Logout
//       </button>
//     </div>
//   );
// }
