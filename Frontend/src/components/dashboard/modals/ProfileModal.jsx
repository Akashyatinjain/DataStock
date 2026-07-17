import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { updateUserProfile } from '../../../store/slices/authSlice';

export default function ProfileModal({ profile, onClose, onUpdated, toast }) {
  const dispatch = useDispatch();
  const updating = useSelector((state) => state.auth.updating);
  const [username, setUsername] = useState(profile?.username || profile?.name || '');

  const handleSave = async () => {
    const result = await dispatch(updateUserProfile({ username: username.trim() }));
    if (updateUserProfile.fulfilled.match(result)) {
      toast('success', 'Profile updated');
      const user = result.payload.user || result.payload.data?.user || result.payload;
      onUpdated(user);
      onClose();
    } else {
      toast('error', result.payload || 'Failed to update profile');
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-6 w-full max-w-sm border border-gray-100 dark:border-slate-800 transition-colors duration-200">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-gray-900 dark:text-white">Edit Profile</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="space-y-3 mb-5">
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white dark:bg-slate-800 text-gray-900 dark:text-white transition-colors"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Email</label>
            <input
              value={profile?.email || ''}
              readOnly
              className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm bg-gray-50 dark:bg-slate-800/50 text-gray-500 dark:text-gray-400 focus:outline-none cursor-not-allowed transition-colors"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={updating || !username.trim()}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-green-600 hover:bg-green-700 text-white transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {updating && <Loader2 className="w-4 h-4 animate-spin" />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
