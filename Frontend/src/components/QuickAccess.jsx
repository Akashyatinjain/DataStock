// components/QuickAccess.jsx
import React from 'react';
import { FileText, FolderOpen, Image as ImageIcon, File } from 'lucide-react';

const QuickAccess = () => {
  const quickAccessItems = [
    { name: 'Project Proposal.pdf', icon: FileText, color: 'text-red-500', bg: 'bg-red-50' },
    { name: 'Design Assets', icon: FolderOpen, color: 'text-green-500', bg: 'bg-green-50' },
    { name: 'Team Photo.jpg', icon: ImageIcon, color: 'text-blue-500', bg: 'bg-blue-50' },
    { name: 'Q4 Report.xlsx', icon: File, color: 'text-green-600', bg: 'bg-green-50' },
    { name: 'Marketing Videos', icon: FolderOpen, color: 'text-purple-500', bg: 'bg-purple-50' },
  ];

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
          Quick Access
        </h2>
        <button className="text-xs text-green-600 hover:text-green-700 font-medium">
          View all
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {quickAccessItems.map((item, i) => {
          const Icon = item.icon;
          return (
            <button
              key={i}
              className="flex items-center space-x-3 p-3 bg-white rounded-xl border border-gray-200 hover:border-green-300 hover:shadow-sm transition group"
            >
              <div className={`w-8 h-8 ${item.bg} rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform`}>
                <Icon className={`w-4 h-4 ${item.color}`} />
              </div>
              <span className="text-sm text-gray-700 truncate">{item.name}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default QuickAccess;