import React from 'react';

export default function Logo({ size = 'md', className = '', showText = false, textClassName = '', onClick }) {
  const sizeMap = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-12 h-12',
  };

  const imageSizeClass = sizeMap[size] || size;

  return (
    <div 
      className={`flex items-center gap-2.5 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      <img 
        src="/datastock-logo.svg" 
        alt="DataStock Logo" 
        className={`${imageSizeClass} object-contain transition-transform duration-200 group-hover:scale-105 rounded-xl shadow-xs`} 
      />
      {showText && (
        <span className={`font-extrabold tracking-tight text-gray-900 dark:text-[#F8FAFC] ${textClassName || 'text-xl'}`}>
          Data<span className="text-[#3B82F6]">Stock</span>
        </span>
      )}
    </div>
  );
}
