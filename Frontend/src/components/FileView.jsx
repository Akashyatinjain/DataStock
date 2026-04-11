// components/FileView.jsx
import React from 'react';
import {
  Folder,
  File,
  Image as ImageIcon,
  FileText,
  Video,
  Music,
  Archive,
  MoreVertical,
  CheckCircle2,
  Star,
  Users,
  Grid,
  List,
  Download,
  Share2,
  Trash2,
  Move,
  Upload
} from 'lucide-react';

const FileView = ({ 
  viewMode, 
  setViewMode, 
  files, 
  selectedFiles, 
  setSelectedFiles 
}) => {
  const getFileIcon = (file) => {
    if (file.isFolder) return Folder;
    const ext = file.name?.split('.').pop().toLowerCase();
    if (['jpg', 'png', 'gif', 'svg', 'webp'].includes(ext)) return ImageIcon;
    if (['mp4', 'mov', 'avi', 'mkv'].includes(ext)) return Video;
    if (['mp3', 'wav', 'flac'].includes(ext)) return Music;
    if (['zip', 'rar', '7z', 'tar'].includes(ext)) return Archive;
    if (['pdf'].includes(ext)) return FileText;
    return File;
  };

  const getFileColor = (file) => {
    if (file.isFolder) return 'bg-yellow-50 text-yellow-600';
    const ext = file.name?.split('.').pop().toLowerCase();
    if (['jpg', 'png', 'gif', 'svg'].includes(ext)) return 'bg-blue-50 text-blue-600';
    if (['mp4', 'mov', 'avi'].includes(ext)) return 'bg-purple-50 text-purple-600';
    if (['pdf'].includes(ext)) return 'bg-red-50 text-red-600';
    if (['xlsx', 'xls'].includes(ext)) return 'bg-green-50 text-green-600';
    if (['docx', 'doc'].includes(ext)) return 'bg-blue-50 text-blue-600';
    return 'bg-gray-100 text-gray-600';
  };

  const toggleFileSelection = (fileId) => {
    setSelectedFiles(prev =>
      prev.includes(fileId)
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const selectAll = () => {
    if (selectedFiles.length === files.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(files.map(f => f.id));
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border-b border-gray-100">
        <div className="flex items-center space-x-2">
          {/* Select All Checkbox */}
          {files.length > 0 && (
            <label className="flex items-center space-x-2 px-2 py-1 hover:bg-gray-50 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={selectedFiles.length === files.length && files.length > 0}
                onChange={selectAll}
                className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span className="text-sm text-gray-600">
                {selectedFiles.length > 0 ? `${selectedFiles.length} selected` : 'Select all'}
              </span>
            </label>
          )}

          {/* View Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded transition ${
                viewMode === 'grid' 
                  ? 'bg-white text-green-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded transition ${
                viewMode === 'list' 
                  ? 'bg-white text-green-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Batch Actions */}
          {selectedFiles.length > 0 && (
            <div className="flex items-center space-x-1 ml-2">
              <button className="p-2 text-gray-600 hover:text-green-600 hover:bg-gray-100 rounded-lg transition" title="Download">
                <Download className="w-4 h-4" />
              </button>
              <button className="p-2 text-gray-600 hover:text-green-600 hover:bg-gray-100 rounded-lg transition" title="Share">
                <Share2 className="w-4 h-4" />
              </button>
              <button className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Delete">
                <Trash2 className="w-4 h-4" />
              </button>
              <button className="p-2 text-gray-600 hover:text-green-600 hover:bg-gray-100 rounded-lg transition" title="Move">
                <Move className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center space-x-2 text-sm">
            <Upload className="w-4 h-4" />
            <span>Upload</span>
          </button>
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center space-x-2 text-sm shadow-sm">
            <Folder className="w-4 h-4" />
            <span>New folder</span>
          </button>
        </div>
      </div>

      {/* Files Container */}
      <div className="p-4">
        {/* Grid View */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {files.map((file) => {
              const Icon = getFileIcon(file);
              const iconColor = getFileColor(file);
              const isSelected = selectedFiles.includes(file.id);
              
              return (
                <div
                  key={file.id}
                  onClick={() => toggleFileSelection(file.id)}
                  className={`relative p-3 rounded-lg border transition-all cursor-pointer group ${
                    isSelected 
                      ? 'border-green-500 bg-green-50 shadow-sm' 
                      : 'border-gray-200 hover:border-green-300 hover:shadow-md'
                  }`}
                >
                  {/* Checkbox */}
                  <div className={`absolute top-2 right-2 z-10 w-5 h-5 rounded border-2 transition-all ${
                    isSelected 
                      ? 'bg-green-600 border-green-600' 
                      : 'border-gray-300 bg-white opacity-0 group-hover:opacity-100'
                  }`}>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </div>

                  {/* File Icon */}
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-3 ${iconColor}`}>
                    <Icon className="w-6 h-6" />
                  </div>

                  {/* File Info */}
                  <h3 className="text-sm font-medium text-gray-900 truncate mb-1 pr-6">
                    {file.name}
                  </h3>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{file.size}</span>
                    <div className="flex items-center space-x-1">
                      {file.starred && <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />}
                      {file.shared && <Users className="w-3 h-3 text-gray-400" />}
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{file.modified}</p>

                  {/* Hover Actions */}
                  <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition">
                    <button className="p-1.5 bg-white rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50">
                      <MoreVertical className="w-3.5 h-3.5 text-gray-600" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <>
            {/* Header */}
            <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-gray-50 rounded-lg text-xs font-medium text-gray-500 uppercase tracking-wider">
              <div className="col-span-5 flex items-center space-x-2">
                <span>Name</span>
              </div>
              <div className="col-span-2">Size</div>
              <div className="col-span-2">Modified</div>
              <div className="col-span-2">Owner</div>
              <div className="col-span-1"></div>
            </div>

            {/* File Rows */}
            <div className="divide-y divide-gray-100 mt-2">
              {files.map((file) => {
                const Icon = getFileIcon(file);
                const iconColor = getFileColor(file);
                const isSelected = selectedFiles.includes(file.id);
                
                return (
                  <div
                    key={file.id}
                    onClick={() => toggleFileSelection(file.id)}
                    className={`grid grid-cols-12 gap-4 px-4 py-3 items-center transition-all cursor-pointer rounded-lg ${
                      isSelected ? 'bg-green-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="col-span-5 flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconColor}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">{file.name}</span>
                        {file.starred && <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />}
                        {file.shared && <Users className="w-3.5 h-3.5 text-gray-400" />}
                      </div>
                    </div>
                    <div className="col-span-2 text-sm text-gray-600">{file.size}</div>
                    <div className="col-span-2 text-sm text-gray-600">{file.modified}</div>
                    <div className="col-span-2 text-sm text-gray-600">You</div>
                    <div className="col-span-1 flex justify-end">
                      <button className="p-1.5 hover:bg-gray-100 rounded-lg transition">
                        <MoreVertical className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Empty State */}
        {files.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Folder className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">This folder is empty</h3>
            <p className="text-gray-500 mb-4">Upload files or create a new folder to get started</p>
            <div className="flex items-center justify-center space-x-3">
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm">
                Upload Files
              </button>
              <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm">
                Create Folder
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileView;