// components/RecentActivity.jsx
import React from 'react';
import { Link as LinkIcon, MessageCircle, Edit3, Upload, Share2 } from 'lucide-react';

const RecentActivity = () => {
  const activities = [
    { 
      id: 1, 
      user: 'Sarah Johnson', 
      action: 'edited', 
      file: 'Project Proposal.pdf', 
      time: '10 min ago', 
      avatar: 'SJ',
      icon: Edit3,
      iconColor: 'text-blue-500',
      iconBg: 'bg-blue-50'
    },
    { 
      id: 2, 
      user: 'Mike Chen', 
      action: 'shared', 
      file: 'Design Assets', 
      time: '1 hour ago', 
      avatar: 'MC',
      icon: Share2,
      iconColor: 'text-green-500',
      iconBg: 'bg-green-50'
    },
    { 
      id: 3, 
      user: 'You', 
      action: 'uploaded', 
      file: 'Team Photo.jpg', 
      time: '3 hours ago', 
      avatar: 'You',
      icon: Upload,
      iconColor: 'text-purple-500',
      iconBg: 'bg-purple-50'
    },
    { 
      id: 4, 
      user: 'Alex Kim', 
      action: 'commented on', 
      file: 'Q4 Report.xlsx', 
      time: 'Yesterday', 
      avatar: 'AK',
      icon: MessageCircle,
      iconColor: 'text-orange-500',
      iconBg: 'bg-orange-50'
    },
  ];

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
        <button className="text-sm text-green-600 hover:text-green-700 font-medium">
          View all
        </button>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {activities.map((activity) => {
          const Icon = activity.icon;
          return (
            <div key={activity.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600">{activity.avatar}</span>
                  </div>
                  <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 ${activity.iconBg} rounded-full flex items-center justify-center border-2 border-white`}>
                    <Icon className={`w-2.5 h-2.5 ${activity.iconColor}`} />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">{activity.user}</span>
                    {' '}{activity.action}{' '}
                    <span className="font-medium text-green-600 hover:underline cursor-pointer">
                      {activity.file}
                    </span>
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{activity.time}</p>
                </div>
              </div>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                <LinkIcon className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default RecentActivity;