import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  FileText,
  Download,
  FileImage,
  FileVideo,
  FileSpreadsheet,
  FileArchive,
  FileCode,
  FileAudio,
  MessageSquare,
  Trash2,
  Loader2,
  ArrowLeft,
  Upload,
  History,
  RotateCcw
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { socket, connectSocket } from '../../socket';
import { authFetch, apiUrl } from '../../utils/auth';

const FilePreviewModal = ({
  file,
  isOpen,
  onClose
}) => {
  const user = useSelector((state) => state.auth.user);
  const [activeFile, setActiveFile] = useState(file);
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const typingTimeoutRef = useRef(null);
  const [activeMobileTab, setActiveMobileTab] = useState("preview");
  const [activeRightTab, setActiveRightTab] = useState("comments"); // "comments" or "versions"
  const [versions, setVersions] = useState([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [uploadingVersion, setUploadingVersion] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [restoringVersionId, setRestoringVersionId] = useState(null);
  const [deletingVersionId, setDeletingVersionId] = useState(null);
  const fileInputRef = useRef(null);
  const commentsEndRef = useRef(null);

  const fileId = activeFile?.id || activeFile?._id || file?.id || file?._id;
  const maxVersionNumber = versions.length > 0 ? Math.max(...versions.map(ver => ver.versionNumber)) : 0;

  useEffect(() => {
    if (file) {
      setActiveFile(file);
    }
  }, [file]);

  const hasPreview = () => {
    const mimeType = activeFile?.mimeType || '';
    return (
      mimeType.includes('image') ||
      mimeType.includes('video') ||
      mimeType.includes('audio') ||
      mimeType.includes('pdf') ||
      mimeType.includes('text') ||
      mimeType.includes('json') ||
      mimeType.includes('javascript') ||
      mimeType.includes('html') ||
      mimeType.includes('css') ||
      mimeType.includes('xml') ||
      mimeType.includes('word') ||
      mimeType.includes('excel') ||
      mimeType.includes('spreadsheet') ||
      mimeType.includes('presentation') ||
      mimeType.includes('powerpoint')
    );
  };

  const scrollToBottom = () => {
    if (commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const formatBytes = (bytes, decimals = 2) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const loadVersions = () => {
    if (!fileId) return;
    setLoadingVersions(true);
    authFetch(apiUrl(`/files/${fileId}/versions`))
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setVersions(data.versions || []);
        }
      })
      .catch((err) => console.error("Error loading versions:", err))
      .finally(() => setLoadingVersions(false));
  };

  useEffect(() => {
    if (isOpen && fileId && activeRightTab === "versions") {
      loadVersions();
    }
  }, [isOpen, fileId, activeRightTab]);

  const handleRestoreVersion = async (versionId) => {
    setRestoringVersionId(versionId);
    if (hasPreview()) {
      setPreviewLoading(true);
    }
    try {
      const res = await authFetch(apiUrl(`/files/${fileId}/versions/${versionId}/restore`), {
        method: "POST"
      });
      const data = await res.json();
      if (data.success) {
        setActiveFile(data.file);
        loadVersions();
      } else {
        setPreviewLoading(false);
      }
    } catch (err) {
      console.error("Error restoring version:", err);
      setPreviewLoading(false);
    } finally {
      setRestoringVersionId(null);
    }
  };

  const handleDeleteVersion = async (versionId) => {
    if (!window.confirm("Are you sure you want to permanently delete this version?")) return;
    setDeletingVersionId(versionId);
    try {
      const res = await authFetch(apiUrl(`/files/${fileId}/versions/${versionId}`), {
        method: "DELETE"
      });
      const data = await res.json();
      if (data.success) {
        setActiveFile(data.file);
        loadVersions();
      }
    } catch (err) {
      console.error("Error deleting version:", err);
    } finally {
      setDeletingVersionId(null);
    }
  };

  const handleUploadVersionClick = () => {
    fileInputRef.current?.click();
  };

  const handleUploadVersion = async (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setUploadingVersion(true);
    if (hasPreview()) {
      setPreviewLoading(true);
    }
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("fileId", fileId || "");
    formData.append("folderId", activeFile.folderId || "");

    try {
      const res = await authFetch(apiUrl("/files/upload"), {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setActiveFile(data.file);
        loadVersions();
      } else {
        setPreviewLoading(false);
      }
    } catch (err) {
      console.error("Error uploading version:", err);
      setPreviewLoading(false);
    } finally {
      setUploadingVersion(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  useEffect(() => {
    if (isOpen && comments.length > 0) {
      const timer = setTimeout(scrollToBottom, 50);
      return () => clearTimeout(timer);
    }
  }, [comments, isOpen]);

  useEffect(() => {
    if (activeMobileTab === "comments") {
      const timer = setTimeout(scrollToBottom, 50);
      return () => clearTimeout(timer);
    }
  }, [activeMobileTab]);

  useEffect(() => {
    if (isOpen && fileId) {
      setLoadingComments(true);
      authFetch(apiUrl(`/comments?fileId=${fileId}`))
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setComments(data.comments || []);
          }
        })
        .catch((err) => console.error("Error loading comments:", err))
        .finally(() => setLoadingComments(false));

      // Ensure socket connection is active and join room
      connectSocket();
      socket.emit("join_file", fileId);

      const handleNewComment = (comment) => {
        setComments((prev) => {
          // If we already have the comment by ID, ignore
          if (prev.some((c) => c.id === comment.id)) return prev;

          // If we have an optimistic match with the same content and user, swap it
          const optimisticIndex = prev.findIndex(
            (c) => c.isOptimistic && c.userId === comment.userId && c.content === comment.content
          );

          if (optimisticIndex !== -1) {
            const next = [...prev];
            next[optimisticIndex] = comment;
            return next;
          }

          return [...prev, comment];
        });
      };

      const handleCommentDeleted = ({ commentId }) => {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      };

      const handleTypingComment = ({ fileId: incomingFileId, userId, username, isTyping: userIsTyping }) => {
        if (incomingFileId !== fileId) return;
        setTypingUsers((prev) => {
          const next = { ...prev };
          if (userIsTyping) {
            next[userId] = username;
          } else {
            delete next[userId];
          }
          return next;
        });
      };

      socket.on("new_comment", handleNewComment);
      socket.on("comment_deleted", handleCommentDeleted);
      socket.on("typing_comment", handleTypingComment);

      return () => {
        socket.emit("leave_file", fileId);
        socket.off("new_comment", handleNewComment);
        socket.off("comment_deleted", handleCommentDeleted);
        socket.off("typing_comment", handleTypingComment);
        setComments([]);
        setTypingUsers({});
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      };
    }
  }, [isOpen, fileId]);

  if (!isOpen || !activeFile) return null;

  const mime = activeFile.mimeType || '';
  const url = activeFile.url;

  // FILE TYPES
  const isImage = mime.includes('image');
  const isVideo = mime.includes('video');
  const isAudio = mime.includes('audio');
  const isPdf = mime.includes('pdf');

  const isText =
    mime.includes('text') ||
    mime.includes('json') ||
    mime.includes('javascript') ||
    mime.includes('html') ||
    mime.includes('css') ||
    mime.includes('xml');

  const isOffice =
    mime.includes('word') ||
    mime.includes('excel') ||
    mime.includes('spreadsheet') ||
    mime.includes('presentation') ||
    mime.includes('powerpoint');

  const isArchive =
    mime.includes('zip') ||
    mime.includes('rar') ||
    mime.includes('7z');

  // FILE ICON
  const getFileIcon = () => {
    if (isImage) return <FileImage className="w-20 h-20 text-blue-500" />;
    if (isVideo) return <FileVideo className="w-20 h-20 text-purple-500" />;
    if (isAudio) return <FileAudio className="w-20 h-20 text-pink-500" />;
    if (isOffice) return <FileSpreadsheet className="w-20 h-20 text-green-500" />;
    if (isArchive) return <FileArchive className="w-20 h-20 text-yellow-500" />;
    if (isText) return <FileCode className="w-20 h-20 text-orange-500" />;

    return <FileText className="w-20 h-20 text-gray-400" />;
  };

  const handleCommentChange = (e) => {
    setNewComment(e.target.value);

    if (!isTyping) {
      setIsTyping(true);
      socket.emit("typing_comment", { fileId, isTyping: true });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit("typing_comment", { fileId, isTyping: false });
    }, 2000);
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    const commentText = newComment.trim();
    if (!commentText) return;

    if (isTyping) {
      setIsTyping(false);
      socket.emit("typing_comment", { fileId, isTyping: false });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    }

    // Reset input instantly
    setNewComment("");

    // Create optimistic comment
    const tempId = `temp-${Date.now()}`;
    const optimisticComment = {
      id: tempId,
      content: commentText,
      userId: user?.id,
      createdAt: new Date().toISOString(),
      user: {
        id: user?.id,
        username: user?.username || "You",
        imageUrl: user?.imageUrl || null,
        email: user?.email || ""
      },
      isOptimistic: true
    };

    // Add instantly to view
    setComments((prev) => [...prev, optimisticComment]);

    try {
      const res = await authFetch(apiUrl("/comments"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileId,
          content: commentText,
        }),
      });
      const data = await res.json();
      if (data.success) {
        // Swap temp comment with official database entry
        setComments((prev) =>
          prev.map((c) => (c.id === tempId ? data.comment : c))
        );
      } else {
        // Remove optimistic comment if rejected by server
        setComments((prev) => prev.filter((c) => c.id !== tempId));
      }
    } catch (err) {
      // Remove optimistic comment if request failed
      setComments((prev) => prev.filter((c) => c.id !== tempId));
      console.error("Error submitting comment:", err);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const res = await authFetch(apiUrl(`/comments/${commentId}`), {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      }
    } catch (err) {
      console.error("Error deleting comment:", err);
    }
  };

  const formatCommentTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-6xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col md:flex-row transition-colors duration-200">
        
        {/* LEFT COLUMN: PREVIEW + HEADER */}
        <div className={`flex-1 flex flex-col min-w-0 ${activeMobileTab === "preview" ? "flex" : "hidden md:flex"}`}>
          
          {/* LEFT HEADER */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0 gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                {file.originalName}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {mime}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Mobile Toggle Button to view comments */}
              <button
                type="button"
                onClick={() => setActiveMobileTab("comments")}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition md:hidden relative"
                title="View Comments"
              >
                <MessageSquare className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                {comments.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                    {comments.length}
                  </span>
                )}
              </button>

              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                download
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
              >
                <Download className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </a>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>

          {/* CONTENT PREVIEW */}
          <div className="bg-gray-100 dark:bg-gray-950 flex-1 flex items-center justify-center overflow-auto min-h-[45vh] md:min-h-0 relative">
            {/* PREVIEW LOADER OVERLAY */}
            {previewLoading && (
              <div className="absolute inset-0 bg-white/70 dark:bg-gray-950/70 backdrop-blur-xs flex flex-col items-center justify-center z-20 transition-all duration-200">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-2" />
                <span className="text-xs font-semibold text-gray-550 dark:text-gray-400 animate-pulse select-none">Loading preview...</span>
              </div>
            )}

            {/* IMAGE */}
            {isImage && (
              <img
                src={url}
                alt={file.originalName}
                className="max-h-full max-w-full object-contain"
                onLoad={() => setPreviewLoading(false)}
                onError={() => setPreviewLoading(false)}
              />
            )}

            {/* VIDEO */}
            {isVideo && (
              <video
                controls
                className="max-h-full max-w-full rounded-xl"
                onLoadedData={() => setPreviewLoading(false)}
                onError={() => setPreviewLoading(false)}
              >
                <source src={url} type={mime} />
              </video>
            )}

            {/* AUDIO */}
            {isAudio && (
              <div className="bg-white dark:bg-gray-900 p-10 rounded-2xl shadow-lg text-center border border-gray-100 dark:border-gray-800">
                <FileAudio className="w-24 h-24 mx-auto text-pink-500 mb-4" />
                <p className="text-lg font-semibold mb-5 text-gray-900 dark:text-gray-100">
                  Audio Preview
                </p>
                <audio
                  controls
                  className="w-full"
                  onLoadedData={() => setPreviewLoading(false)}
                  onError={() => setPreviewLoading(false)}
                >
                  <source src={url} type={mime} />
                </audio>
              </div>
            )}

            {/* PDF */}
            {isPdf && (
              <div className="w-full h-[78vh] flex flex-col">
                <div className="bg-emerald-50 dark:bg-emerald-950/20 border-b border-emerald-100 dark:border-emerald-900/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 text-sm">
                  <div className="text-gray-700 dark:text-gray-300">
                    <span className="font-semibold text-emerald-800 dark:text-emerald-400">💡 Tip:</span> If the preview below says "No preview available", your Cloudinary account is blocking PDF delivery. You can enable it in your <strong className="text-emerald-950 dark:text-emerald-300">Cloudinary Console &gt; Settings &gt; Security &gt; Allow delivery of PDF and ZIP files</strong>.
                  </div>
                  <a
                     href={url}
                     target="_blank"
                     rel="noreferrer"
                     className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs transition inline-flex items-center gap-1 shrink-0 justify-center whitespace-nowrap"
                  >
                    Open PDF in New Tab
                  </a>
                </div>
                <iframe
                  src={`https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`}
                  title={file.originalName}
                  className="w-full flex-1 border-0 bg-white"
                  onLoad={() => setPreviewLoading(false)}
                />
              </div>
            )}

            {/* TEXT / CODE FILES */}
            {isText && (
              <iframe
                src={url}
                title={file.originalName}
                className="w-full h-[78vh] bg-white border-0"
                onLoad={() => setPreviewLoading(false)}
              />
            )}

            {/* OFFICE FILES */}
            {isOffice && (
              <iframe
                src={`https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`}
                title={file.originalName}
                className="w-full h-[78vh] border-0"
                onLoad={() => setPreviewLoading(false)}
              />
            )}

            {/* OTHER FILES */}
            {!isImage && !isVideo && !isAudio && !isPdf && !isText && !isOffice && (
              <div className="text-center p-10">
                {getFileIcon()}
                <p className="text-xl font-semibold text-gray-700 dark:text-gray-300 mt-4">
                  Preview not available
                </p>
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                  This file type cannot be previewed directly.
                </p>
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-6 inline-block px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition"
                >
                  Open / Download File
                </a>
              </div>
            )}
          </div>
        </div>        {/* RIGHT COLUMN: DETAIL/COMMENTS/VERSIONS SIDE PANEL */}
        <div className={`w-full md:w-[380px] border-t md:border-t-0 md:border-l border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950/40 flex flex-col shrink-0 min-h-0 ${
          activeMobileTab === "comments" ? "flex flex-1 min-h-[50vh] md:min-h-0 max-h-[80vh] md:max-h-[92vh]" : "hidden md:flex"
        }`}>
          {/* Panel Header with Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col shrink-0">
            <div className="px-6 pt-4 pb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveMobileTab("preview")}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition md:hidden mr-1"
                  title="Back to Preview"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
                <span className="font-semibold text-gray-800 dark:text-gray-250">File Details</span>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                title="Close Modal"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            {/* Tabs */}
            <div className="flex px-4 border-t border-gray-100 dark:border-gray-800/60">
              <button
                onClick={() => setActiveRightTab("comments")}
                className={`flex-1 py-2.5 text-xs font-semibold border-b-2 text-center transition outline-none ${
                  activeRightTab === "comments"
                    ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                Comments ({comments.length})
              </button>
              <button
                onClick={() => setActiveRightTab("versions")}
                className={`flex-1 py-2.5 text-xs font-semibold border-b-2 text-center transition outline-none ${
                  activeRightTab === "versions"
                    ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                Versions
              </button>
            </div>
          </div>

          {activeRightTab === "comments" ? (
            <>
              {/* Comments List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loadingComments ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                    <span className="text-xs text-gray-400">Loading comments...</span>
                  </div>
                ) : comments.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-3">
                      <MessageSquare className="w-6 h-6 text-gray-400 dark:text-gray-550" />
                    </div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">No comments yet</h4>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Start the conversation by typing below.</p>
                  </div>
                ) : (
                  comments.map((c) => {
                    const isMyComment = c.userId === user?.id;
                    const canDelete = isMyComment || activeFile.ownerId === user?.id;
                    return (
                      <div key={c.id} className="bg-white dark:bg-gray-900 p-3 rounded-xl border border-gray-100 dark:border-gray-800 shadow-xs group relative transition-colors duration-200">
                        <div className="flex items-start gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-linear-to-br from-emerald-400 to-cyan-400 flex items-center justify-center text-white text-[11px] font-bold overflow-hidden shrink-0">
                            {c.user?.imageUrl ? (
                              <img src={c.user.imageUrl} className="w-full h-full object-cover" alt={c.user.username} />
                            ) : (
                              <span>{(c.user?.username || "U").charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-semibold text-gray-800 dark:text-gray-250 truncate">
                                {c.user?.username}
                              </span>
                              <span className="text-[10px] text-gray-400 dark:text-gray-500 shrink-0">
                                {formatCommentTime(c.createdAt)}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 break-words leading-relaxed">
                              {c.content}
                            </p>
                          </div>
                        </div>
                        {canDelete && (
                          <button
                            onClick={() => handleDeleteComment(c.id)}
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-md transition duration-150"
                            title="Delete comment"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })
                )}

                {/* Bouncing Dots Typing Indicator */}
                {Object.keys(typingUsers).length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 italic bg-white dark:bg-gray-900 p-2.5 rounded-xl border border-dashed border-gray-200 dark:border-gray-850">
                    <span className="font-medium text-emerald-600 dark:text-emerald-400 truncate max-w-[120px]">
                      {Object.values(typingUsers).join(", ")}
                    </span>
                    <span>{Object.keys(typingUsers).length > 1 ? "are" : "is"} typing...</span>
                    <div className="flex gap-1 items-center ml-1 shrink-0">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" />
                    </div>
                  </div>
                )}
                <div ref={commentsEndRef} />
              </div>

              {/* Comment Input Form */}
              <form onSubmit={handleCommentSubmit} className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={handleCommentChange}
                    placeholder="Add a comment..."
                    className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-955 text-xs border border-gray-200 dark:border-gray-800 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-emerald-500 focus:bg-white dark:focus:bg-gray-900 focus:border-transparent outline-none transition"
                  />
                  <button
                    type="submit"
                    disabled={!newComment.trim()}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs transition shrink-0"
                  >
                    Send
                  </button>
                </div>
              </form>
            </>
          ) : (
            <>
              {/* Version Management Action Panel */}
              <div className="p-4 border-b border-gray-200/60 dark:border-gray-850 bg-white dark:bg-gray-900/40 shrink-0 flex items-center justify-between">
                <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 select-none">Keep track of edits & revisions</span>
                <button
                  onClick={handleUploadVersionClick}
                  disabled={uploadingVersion || restoringVersionId !== null || deletingVersionId !== null}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                >
                  {uploadingVersion ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      Upload Version
                    </>
                  )}
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleUploadVersion}
                  className="hidden"
                />
              </div>

              {/* Version History List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loadingVersions ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                    <span className="text-xs text-gray-400">Loading version history...</span>
                  </div>
                ) : versions.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-3">
                      <History className="w-6 h-6 text-gray-400 dark:text-gray-550" />
                    </div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">No version history found</h4>
                    <p className="text-xs text-gray-450 dark:text-gray-550 mt-1">Files uploaded with matching names will show revisions here.</p>
                  </div>
                ) : (
                  versions.map((v) => {
                    const isCurrent = v.versionNumber === maxVersionNumber;
                    return (
                      <div
                        key={v.id}
                        className={`p-3.5 rounded-xl border flex flex-col gap-2.5 transition-all duration-200 ${
                          isCurrent
                            ? "bg-emerald-50/20 dark:bg-emerald-950/10 border-emerald-500/35 shadow-xs"
                            : "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-bold text-gray-800 dark:text-gray-250">
                                Version {v.versionNumber}
                              </span>
                              {isCurrent && (
                                <span className="bg-emerald-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0 select-none">
                                  Current
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-gray-450 dark:text-gray-500 mt-1 select-none">
                              Uploaded {new Date(v.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <span className="text-xs font-semibold text-gray-550 dark:text-gray-400 shrink-0 select-none">
                            {formatBytes(v.size)}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-end gap-1.5 mt-1 pt-2 border-t border-gray-100/50 dark:border-gray-800/50">
                          <a
                            href={v.url}
                            target="_blank"
                            rel="noreferrer"
                            download
                            className="inline-flex h-7 px-2.5 items-center justify-center rounded-lg text-xs font-medium text-gray-600 hover:text-emerald-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-emerald-400 dark:hover:bg-gray-800 transition select-none"
                            title="Download this specific version"
                          >
                            <Download className="w-3.5 h-3.5 mr-1" />
                            Download
                          </a>

                          {!isCurrent && (
                            <>
                              <button
                                onClick={() => handleRestoreVersion(v.id)}
                                disabled={uploadingVersion || restoringVersionId !== null || deletingVersionId !== null}
                                className="inline-flex h-7 px-2.5 items-center justify-center rounded-lg text-xs font-medium text-gray-600 hover:text-emerald-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-emerald-400 dark:hover:bg-gray-800 transition select-none disabled:opacity-40"
                                title="Restore this version as the active file version"
                              >
                                {restoringVersionId === v.id ? (
                                  <>
                                    <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin text-emerald-600" />
                                    Restoring...
                                  </>
                                ) : (
                                  <>
                                    <RotateCcw className="w-3.5 h-3.5 mr-1" />
                                    Restore
                                  </>
                                )}
                              </button>

                              {versions.length > 1 && (
                                <button
                                  onClick={() => handleDeleteVersion(v.id)}
                                  disabled={uploadingVersion || restoringVersionId !== null || deletingVersionId !== null}
                                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-gray-450 hover:bg-red-50 hover:text-red-500 dark:text-gray-550 dark:hover:bg-red-950/20 dark:hover:text-red-400 transition disabled:opacity-40"
                                  title="Delete version permanently"
                                >
                                  {deletingVersionId === v.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-red-550" />
                                  ) : (
                                    <Trash2 className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
};

export default FilePreviewModal;