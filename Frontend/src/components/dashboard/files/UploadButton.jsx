import React from 'react';
import { Loader2, Upload } from 'lucide-react';
import { ALLOWED_UPLOAD_ACCEPT } from '../../../utils/uploadValidation';

const UploadButton = ({ uploading, onChange }) => (
  <label className="cursor-pointer inline-flex max-w-full">
    <input
      type="file"
      className="hidden"
      accept={ALLOWED_UPLOAD_ACCEPT}
      onChange={onChange}
      multiple
    />
    <div
      className={`
      px-3.5 py-1.5 rounded-lg inline-flex items-center gap-2 transition-all duration-200 font-medium text-xs sm:text-sm whitespace-nowrap shadow-xs cursor-pointer select-none
      ${uploading
        ? 'bg-blue-50 dark:bg-blue-950/40 text-[#2563EB] dark:text-blue-400 cursor-not-allowed border border-blue-200 dark:border-blue-800'
        : 'bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1D4ED8] text-white border border-[#2563EB] hover:shadow-sm active:translate-y-0.5'}
    `}
    >
      {uploading ? (
        <Loader2 className="w-4 h-4 animate-spin text-[#2563EB] dark:text-blue-400" />
      ) : (
        <Upload className="w-4 h-4 text-white" />
      )}
      <span className={uploading ? 'text-[#2563EB] dark:text-blue-400' : 'text-white'}>
        {uploading ? 'Uploading…' : 'Upload'}
      </span>
    </div>
  </label>
);

export default UploadButton;

