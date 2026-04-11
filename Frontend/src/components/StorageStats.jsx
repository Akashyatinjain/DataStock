// components/StorageStats.jsx
import React from 'react';
import { HardDrive, File, Share2, Activity, TrendingUp, TrendingDown } from 'lucide-react';

const StorageStats = ({ storageData }) => {
  const stats = [
    {
      title: 'Total Storage',
      value: `${storageData.used} GB`,
      subtitle: `of ${storageData.total} GB used`,
      icon: HardDrive,
      color: 'blue',
      progress: (storageData.used / storageData.total) * 100,
      trend: { value: 12, isUp: true }
    },
    {
      title: 'Total Files',
      value: '247',
      subtitle: '12 added this week',
      icon: File,
      color: 'green',
      trend: { value: 8, isUp: true }
    },
    {
      title: 'Shared Files',
      value: '18',
      subtitle: '5 active shares',
      icon: Share2,
      color: 'purple',
      trend: { value: 3, isUp: true }
    },
    {
      title: 'Recent Activity',
      value: '8',
      subtitle: 'Last 24 hours',
      icon: Activity,
      color: 'orange',
      trend: { value: 2, isUp: false }
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: { bg: 'bg-blue-50', icon: 'text-blue-600', progress: 'bg-blue-600' },
      green: { bg: 'bg-green-50', icon: 'text-green-600', progress: 'bg-green-600' },
      purple: { bg: 'bg-purple-50', icon: 'text-purple-600', progress: 'bg-purple-600' },
      orange: { bg: 'bg-orange-50', icon: 'text-orange-600', progress: 'bg-orange-600' }
    };
    return colors[color];
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        const colorClasses = getColorClasses(stat.color);
        
        return (
          <div key={index} className="bg-white p-5 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 ${colorClasses.bg} rounded-lg flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${colorClasses.icon}`} />
              </div>
              {stat.trend && (
                <div className={`flex items-center space-x-1 text-xs ${
                  stat.trend.isUp ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.trend.isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  <span>{stat.trend.value}%</span>
                </div>
              )}
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
            <p className="text-sm text-gray-500">{stat.subtitle}</p>
            
            {stat.progress !== undefined && (
              <div className="mt-3 w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${colorClasses.progress} rounded-full transition-all duration-500`}
                  style={{ width: `${stat.progress}%` }}
                ></div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default StorageStats;