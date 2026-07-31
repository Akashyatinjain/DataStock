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
      px-4 py-2 rounded-xl inline-flex items-center gap-2 transition-all duration-200 font-bold text-xs sm:text-sm whitespace-nowrap shadow-sm
      ${uploading
        ? 'bg-blue-100 dark:bg-[#3B82F6]/10 text-[#3B82F6] cursor-not-allowed'
        : 'bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white shadow-blue-500/20 hover:shadow-blue-500/35 hover:scale-[1.02] active:scale-95'}
    `}
    >
      {uploading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Upload className="w-4 h-4" />
      )}
      <span>{uploading ? 'Uploading…' : 'Upload'}</span>
    </div>
  </label>
);

export default UploadButton;
