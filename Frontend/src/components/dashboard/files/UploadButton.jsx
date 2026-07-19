import React from 'react';
import { Loader2, Upload } from 'lucide-react';
import { ALLOWED_UPLOAD_ACCEPT } from '../../../utils/uploadValidation';

const UploadButton = ({ uploading, onChange }) => (
  <label className="cursor-pointer inline-flex max-w-full group/btn">
    <input
      type="file"
      className="hidden"
      accept={ALLOWED_UPLOAD_ACCEPT}
      onChange={onChange}
      multiple
    />
    <div
      className={`
      px-5 py-2.5 rounded-2xl inline-flex items-center gap-2 transition-all duration-300 font-bold text-sm shadow-md whitespace-nowrap
      ${uploading
        ? 'bg-blue-100 dark:bg-[#3B82F6]/10 text-[#3B82F6] dark:text-[#3B82F6] cursor-not-allowed'
        : 'bg-gradient-to-r from-[#3B82F6] to-indigo-600 hover:to-[#2563EB] text-white shadow-blue-500/10 hover:shadow-blue-500/30 hover:scale-[1.05] active:scale-[0.96] hover:shadow-[0_0_20px_rgba(59,130,246,0.35)]'}
    `}
    >
      {uploading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Upload className="w-4.5 h-4.5 transition-transform duration-300 group-hover/btn:-translate-y-1 group-hover/btn:scale-110" />
      )}
      <span>{uploading ? 'Uploading…' : 'Upload Files'}</span>
    </div>
  </label>
);

export default UploadButton;
