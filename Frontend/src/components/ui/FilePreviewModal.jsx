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
  Loader2
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { socket } from '../../socket';
import { authFetch, apiUrl } from '../../utils/auth';

const FilePreviewModal = ({
  file,
  isOpen,
  onClose
}) => {
  const user = useSelector((state) => state.auth.user);
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (isOpen && file?.id) {
      setLoadingComments(true);
      authFetch(apiUrl(`/comments?fileId=${file.id}`))
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setComments(data.comments || []);
          }
        })
        .catch((err) => console.error("Error loading comments:", err))
        .finally(() => setLoadingComments(false));

      // Join file comments room
      socket.emit("join_file", file.id);

      const handleNewComment = (comment) => {
        setComments((prev) => {
          if (prev.some((c) => c.id === comment.id)) return prev;
          return [...prev, comment];
        });
      };

      const handleCommentDeleted = ({ commentId }) => {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      };

      const handleTypingComment = ({ fileId, userId, username, isTyping: userIsTyping }) => {
        if (fileId !== file.id) return;
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
        socket.emit("leave_file", file.id);
        socket.off("new_comment", handleNewComment);
        socket.off("comment_deleted", handleCommentDeleted);
        socket.off("typing_comment", handleTypingComment);
        setComments([]);
        setTypingUsers({});
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      };
    }
  }, [isOpen, file?.id]);

  if (!isOpen || !file) return null;

  const mime = file.mimeType || '';
  const url = file.url;

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
      socket.emit("typing_comment", { fileId: file.id, isTyping: true });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit("typing_comment", { fileId: file.id, isTyping: false });
    }, 2000);
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    if (isTyping) {
      setIsTyping(false);
      socket.emit("typing_comment", { fileId: file.id, isTyping: false });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    }

    try {
      const res = await authFetch(apiUrl("/comments"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileId: file.id,
          content: newComment,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNewComment("");
      }
    } catch (err) {
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
        <div className="flex-1 flex flex-col min-w-0">
          
          {/* HEADER */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0">
            <div className="min-w-0">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                {file.originalName}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {mime}
              </p>
            </div>

            <div className="flex items-center gap-2">
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
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition md:hidden"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>

          {/* CONTENT PREVIEW */}
          <div className="bg-gray-100 dark:bg-gray-950 flex-1 flex items-center justify-center overflow-auto min-h-[45vh] md:min-h-0">
            {/* IMAGE */}
            {isImage && (
              <img
                src={url}
                alt={file.originalName}
                className="max-h-full max-w-full object-contain"
              />
            )}

            {/* VIDEO */}
            {isVideo && (
              <video
                controls
                className="max-h-full max-w-full rounded-xl"
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
                <audio controls className="w-full">
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
                />
              </div>
            )}

            {/* TEXT / CODE FILES */}
            {isText && (
              <iframe
                src={url}
                title={file.originalName}
                className="w-full h-[78vh] bg-white border-0"
              />
            )}

            {/* OFFICE FILES */}
            {isOffice && (
              <iframe
                src={`https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`}
                title={file.originalName}
                className="w-full h-[78vh] border-0"
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
        </div>

        {/* RIGHT COLUMN: COMMENTS SIDE PANEL */}
        <div className="w-full md:w-[380px] border-t md:border-t-0 md:border-l border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950/40 flex flex-col max-h-[45vh] md:max-h-[92vh] shrink-0">
          {/* Comments Panel Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-800 dark:text-gray-200">Comments</span>
              <span className="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 text-xs font-semibold px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-900/30">
                {comments.length}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition hidden md:block"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

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
                  <MessageSquare className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                </div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">No comments yet</h4>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Start the conversation by typing below.</p>
              </div>
            ) : (
              comments.map((c) => {
                const isMyComment = c.userId === user?.id;
                const canDelete = isMyComment || file.ownerId === user?.id;
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
                          <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">
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
          </div>

          {/* Comment Input Form */}
          <form onSubmit={handleCommentSubmit} className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0">
            <div className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={handleCommentChange}
                placeholder="Add a comment..."
                className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-950 text-xs border border-gray-200 dark:border-gray-800 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-emerald-500 focus:bg-white dark:focus:bg-gray-900 focus:border-transparent outline-none transition"
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
        </div>

      </div>
    </div>
  );
};

export default FilePreviewModal;