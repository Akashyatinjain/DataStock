import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Sparkles,
  Save,
  CheckCircle2,
  Clock,
  Users,
  MessageSquare,
  Download,
  Maximize2,
  Minimize2,
  Columns,
  Eye,
  Edit3,
  Bold,
  Italic,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Minus,
  RotateCcw,
  RotateCw,
  Loader2,
  FileText,
  AlertCircle,
  HelpCircle,
  Share2,
  ChevronRight,
  ExternalLink,
  Trash2,
  Send,
  CornerDownRight,
  Printer,
  FileDown
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { socket, connectSocket } from '../../socket';
import { apiUrl, authFetch } from '../../utils/auth';

export default function CollaborativeWorkspaceModal({
  file,
  isOpen,
  onClose,
  onFileUpdated,
  toast,
}) {
  const currentUser = useSelector((state) => state.auth.user);

  // Core Document State
  const [content, setContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [docVersion, setDocVersion] = useState(1);
  const [docTitle, setDocTitle] = useState(file?.originalName || 'Untitled Document.md');
  const [isRenaming, setIsRenaming] = useState(false);
  const [permission, setPermission] = useState('EDIT'); // 'EDIT' or 'VIEW'

  // Sync & Status
  // 'SAVED' | 'SAVING' | 'DIRTY' | 'OFFLINE' | 'ERROR'
  const [syncStatus, setSyncStatus] = useState('SAVED');
  const [lastSavedTime, setLastSavedTime] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Collaboration Peers: Array of { socketId, userId, username, email, imageUrl, color, cursor }
  const [activePeers, setActivePeers] = useState([]);
  const [selfColor, setSelfColor] = useState('#6366F1');

  // UI Panels
  const [viewMode, setViewMode] = useState('split'); // 'editor' | 'split' | 'preview'
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showExport, setShowExport] = useState(false);

  // Version Time Machine
  const [versions, setVersions] = useState([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [selectedVersionContent, setSelectedVersionContent] = useState('');
  const [isRestoring, setIsRestoring] = useState(false);

  // Threaded Comments
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyText, setReplyText] = useState({});
  const [replyingTo, setReplyingTo] = useState(null);

  // Undo / Redo History
  const historyRef = useRef([content]);
  const historyIndexRef = useRef(0);

  // Refs
  const textareaRef = useRef(null);
  const saveTimeoutRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const containerRef = useRef(null);

  const fileId = file?.id;

  // Initialize socket & join collaboration room
  useEffect(() => {
    if (!isOpen || !fileId) return;

    setIsLoading(true);
    const s = connectSocket();

    // Fetch raw file content and initial state
    authFetch(apiUrl(`/files/${fileId}/content`))
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          const initText = data.content || '';
          setContent(initText);
          setOriginalContent(initText);
          historyRef.current = [initText];
          historyIndexRef.current = 0;
          if (data.permission) setPermission(data.permission);
          if (data.file?.originalName) setDocTitle(data.file.originalName);
        }
      })
      .catch((err) => {
        console.error('Error fetching file content:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });

    // Join collaborative room
    s.emit('collab:join', { fileId });

    // Socket event listeners
    const handleInitState = (state) => {
      if (state.content !== undefined && state.content !== null) {
        setContent(state.content);
        setOriginalContent(state.content);
        historyRef.current = [state.content];
        historyIndexRef.current = 0;
      }
      if (state.version) setDocVersion(state.version);
      if (state.permission) setPermission(state.permission);
      if (state.selfPeer?.color) setSelfColor(state.selfPeer.color);
      if (Array.isArray(state.activePeers)) {
        setActivePeers(state.activePeers.filter((p) => p.socketId !== s.id));
      }
      setSyncStatus('SAVED');
    };

    const handlePeerJoined = ({ peer }) => {
      if (!peer || peer.socketId === s.id) return;
      setActivePeers((prev) => {
        const filtered = prev.filter((p) => p.socketId !== peer.socketId && p.userId !== peer.userId);
        return [...filtered, peer];
      });
      toast?.info?.(`${peer.username || 'A collaborator'} joined the document`);
    };

    const handlePeerLeft = ({ socketId, remainingPeers }) => {
      if (Array.isArray(remainingPeers)) {
        setActivePeers(remainingPeers.filter((p) => p.socketId !== s.id));
      } else {
        setActivePeers((prev) => prev.filter((p) => p.socketId !== socketId));
      }
    };

    const handleRemoteEdit = ({ text, version, username }) => {
      if (typeof text === 'string') {
        setContent(text);
        if (version) setDocVersion(version);
        // Do not overwrite undo stack with remote edits unless necessary
      }
    };

    const handleRemoteCursor = (cursorData) => {
      setActivePeers((prev) =>
        prev.map((p) => (p.socketId === cursorData.socketId ? { ...p, cursor: cursorData.cursor } : p))
      );
    };

    const handleSaveStatus = ({ status, savedAt, versionNumber }) => {
      if (status === 'SAVED') {
        setSyncStatus('SAVED');
        setLastSavedTime(savedAt ? new Date(savedAt) : new Date());
        if (versionNumber) setDocVersion(versionNumber);
        setOriginalContent(content);
        onFileUpdated?.();
      } else if (status === 'ERROR') {
        setSyncStatus('ERROR');
      }
    };

    const handleDocumentSaved = ({ version, savedAt }) => {
      setSyncStatus('SAVED');
      setLastSavedTime(new Date(savedAt));
      if (version) setDocVersion(version);
      onFileUpdated?.();
    };

    s.on('collab:init_state', handleInitState);
    s.on('collab:peer_joined', handlePeerJoined);
    s.on('collab:peer_left', handlePeerLeft);
    s.on('collab:remote_edit', handleRemoteEdit);
    s.on('collab:remote_cursor', handleRemoteCursor);
    s.on('collab:save_status', handleSaveStatus);
    s.on('collab:document_saved', handleDocumentSaved);

    return () => {
      s.emit('collab:leave', { fileId });
      s.off('collab:init_state', handleInitState);
      s.off('collab:peer_joined', handlePeerJoined);
      s.off('collab:peer_left', handlePeerLeft);
      s.off('collab:remote_edit', handleRemoteEdit);
      s.off('collab:remote_cursor', handleRemoteCursor);
      s.off('collab:save_status', handleSaveStatus);
      s.off('collab:document_saved', handleDocumentSaved);
    };
  }, [isOpen, fileId]);

  // Load versions when versions drawer opens
  useEffect(() => {
    if (showVersions && fileId) {
      setLoadingVersions(true);
      authFetch(apiUrl(`/files/${fileId}/versions`))
        .then((r) => r.json())
        .then((data) => {
          if (data.success && Array.isArray(data.versions)) {
            setVersions(data.versions);
          }
        })
        .catch((err) => console.error('Error fetching versions:', err))
        .finally(() => setLoadingVersions(false));
    }
  }, [showVersions, fileId]);

  // Fetch selected version content for diff view
  useEffect(() => {
    if (selectedVersion?.url) {
      fetch(selectedVersion.url)
        .then((r) => r.text())
        .then((txt) => setSelectedVersionContent(txt))
        .catch(() => setSelectedVersionContent(''));
    } else {
      setSelectedVersionContent('');
    }
  }, [selectedVersion]);

  // Load comments
  useEffect(() => {
    if (showComments && fileId) {
      authFetch(apiUrl(`/comments/file/${fileId}`))
        .then((r) => r.json())
        .then((data) => {
          if (data.success && Array.isArray(data.comments)) {
            setComments(data.comments);
          }
        })
        .catch((err) => console.error('Error loading comments:', err));
    }
  }, [showComments, fileId]);

  // Document statistics
  const stats = useMemo(() => {
    const trimmed = content.trim();
    const words = trimmed ? trimmed.split(/\s+/).length : 0;
    const chars = content.length;
    const readTimeMinutes = Math.max(1, Math.ceil(words / 200));
    return { words, chars, readTimeMinutes };
  }, [content]);

  // Content change handler
  const handleContentChange = (newText) => {
    if (permission !== 'EDIT') return;

    setContent(newText);
    setSyncStatus('DIRTY');

    // Push to undo history stack (max 50)
    const newHistory = historyRef.current.slice(0, historyIndexRef.current + 1);
    newHistory.push(newText);
    if (newHistory.length > 50) newHistory.shift();
    historyRef.current = newHistory;
    historyIndexRef.current = newHistory.length - 1;

    // Emit live edit over WebSockets
    socket.emit('collab:edit', {
      fileId,
      text: newText,
    });

    // Debounce auto-save indicator
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    setSyncStatus('SAVING');
    saveTimeoutRef.current = setTimeout(() => {
      handleForceSave(newText);
    }, 3000);
  };

  // Force save (Ctrl+S or Auto-save)
  const handleForceSave = async (textToSave = content) => {
    if (permission !== 'EDIT') return;
    setSyncStatus('SAVING');

    try {
      const res = await authFetch(apiUrl(`/files/${fileId}/content`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: textToSave }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSyncStatus('SAVED');
        setLastSavedTime(new Date());
        if (data.versionNumber) setDocVersion(data.versionNumber);
        setOriginalContent(textToSave);
        onFileUpdated?.();
      } else {
        setSyncStatus('ERROR');
      }
    } catch (err) {
      console.error('Error during document save:', err);
      setSyncStatus('ERROR');
    }
  };

  // Keyboard shortcuts (Ctrl+S, Ctrl+B, Ctrl+I, etc.)
  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      handleForceSave();
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      if (e.shiftKey) {
        e.preventDefault();
        handleRedo();
      } else {
        e.preventDefault();
        handleUndo();
      }
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
      e.preventDefault();
      handleRedo();
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
      e.preventDefault();
      insertFormatting('**', '**', 'bold text');
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
      e.preventDefault();
      insertFormatting('*', '*', 'italic text');
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      insertFormatting('[', '](https://)', 'link title');
    }
  };

  const handleUndo = () => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current -= 1;
      const prev = historyRef.current[historyIndexRef.current];
      setContent(prev);
      socket.emit('collab:edit', { fileId, text: prev });
    }
  };

  const handleRedo = () => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current += 1;
      const next = historyRef.current[historyIndexRef.current];
      setContent(next);
      socket.emit('collab:edit', { fileId, text: next });
    }
  };

  // Cursor tracking
  const handleCursorMove = () => {
    if (!textareaRef.current) return;
    const { selectionStart, selectionEnd } = textareaRef.current;
    socket.emit('collab:cursor', {
      fileId,
      cursor: { selectionStart, selectionEnd },
    });
  };

  // Formatting helper
  const insertFormatting = (before, after = '', placeholder = '') => {
    if (!textareaRef.current) return;
    const el = textareaRef.current;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = content.substring(start, end) || placeholder;

    const replacement = `${before}${selected}${after}`;
    const newContent = content.substring(0, start) + replacement + content.substring(end);
    handleContentChange(newContent);

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + before.length, start + before.length + selected.length);
    }, 0);
  };

  // Line prefix helper (headings, bullet lists, checklist)
  const insertLinePrefix = (prefix) => {
    if (!textareaRef.current) return;
    const el = textareaRef.current;
    const start = el.selectionStart;
    const beforeCursor = content.substring(0, start);
    const lastNewline = beforeCursor.lastIndexOf('\n');
    const lineStart = lastNewline === -1 ? 0 : lastNewline + 1;

    const newContent = content.substring(0, lineStart) + prefix + content.substring(lineStart);
    handleContentChange(newContent);

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, start + prefix.length);
    }, 0);
  };

  // Interactive Checklist toggle
  const handleToggleTask = (lineIndex) => {
    const lines = content.split('\n');
    if (lines[lineIndex] !== undefined) {
      const line = lines[lineIndex];
      if (line.includes('- [ ]')) {
        lines[lineIndex] = line.replace('- [ ]', '- [x]');
      } else if (line.includes('- [x]')) {
        lines[lineIndex] = line.replace('- [x]', '- [ ]');
      }
      handleContentChange(lines.join('\n'));
    }
  };

  // Version Time Machine Restore
  const handleRestoreVersion = async (v) => {
    if (!v) return;
    if (!window.confirm(`Are you sure you want to restore Version ${v.versionNumber}?`)) return;

    setIsRestoring(true);
    try {
      const res = await authFetch(apiUrl(`/files/${fileId}/versions/${v.id}/restore`), {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast?.success?.(`Restored to Version ${v.versionNumber}`);
        // Refetch latest content
        const cRes = await authFetch(apiUrl(`/files/${fileId}/content`));
        const cData = await cRes.json();
        if (cData.content) {
          setContent(cData.content);
          setOriginalContent(cData.content);
          socket.emit('collab:edit', { fileId, text: cData.content });
        }
        setSelectedVersion(null);
        setShowVersions(false);
        onFileUpdated?.();
      } else {
        toast?.error?.(data.message || 'Failed to restore version');
      }
    } catch (err) {
      console.error('Error restoring version:', err);
      toast?.error?.('Failed to restore version');
    } finally {
      setIsRestoring(false);
    }
  };

  // Comments
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const res = await authFetch(apiUrl('/comments'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileId,
          content: newComment.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setComments((prev) => [data.comment, ...prev]);
        setNewComment('');
        toast?.success?.('Comment added');
      }
    } catch (err) {
      console.error('Error adding comment:', err);
    }
  };

  // Exports
  const exportAsFile = (type) => {
    let blob;
    let extension = 'md';
    let mimeType = 'text/markdown';

    if (type === 'txt') {
      extension = 'txt';
      mimeType = 'text/plain';
      blob = new Blob([content], { type: mimeType });
    } else if (type === 'html') {
      extension = 'html';
      mimeType = 'text/html';
      const rendered = renderMarkdownToHtml(content);
      const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${docTitle}</title><style>body{font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;max-width:800px;margin:40px auto;padding:0 20px;line-height:1.6;color:#1e293b}h1,h2,h3{color:#0f172a}pre{background:#f1f5f9;padding:16px;border-radius:8px;overflow-x:auto}code{background:#f1f5f9;padding:2px 6px;border-radius:4px;color:#e11d48}blockquote{border-left:4px solid #6366f1;padding-left:16px;margin-left:0;color:#64748b}</style></head><body>${rendered}</body></html>`;
      blob = new Blob([fullHtml], { type: mimeType });
    } else {
      blob = new Blob([content], { type: 'text/markdown' });
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = docTitle.replace(/\.[^/.]+$/, '') + `.${extension}`;
    a.click();
    URL.revokeObjectURL(a);
    setShowExport(false);
  };

  const handlePrint = () => {
    window.print();
    setShowExport(false);
  };

  // Markdown renderer with interactive task lists
  const renderMarkdownToHtml = (raw) => {
    if (!raw) return '<p class="text-slate-400 italic">Empty document</p>';

    const lines = raw.split('\n');
    const processedLines = lines.map((line, idx) => {
      let escaped = line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

      // Task list item
      if (escaped.trim().startsWith('- [ ]')) {
        const text = escaped.replace(/^\s*-\s*\[\s*\]\s*/, '');
        return `<div class="flex items-center gap-2.5 my-1.5 group cursor-pointer" data-task-line="${idx}">
          <input type="checkbox" class="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700 cursor-pointer pointer-events-auto" data-line-index="${idx}" />
          <span class="text-slate-700 dark:text-slate-300 text-sm">${text}</span>
        </div>`;
      }
      if (escaped.trim().startsWith('- [x]')) {
        const text = escaped.replace(/^\s*-\s*\[x\]\s*/, '');
        return `<div class="flex items-center gap-2.5 my-1.5 group cursor-pointer" data-task-line="${idx}">
          <input type="checkbox" checked class="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700 cursor-pointer pointer-events-auto" data-line-index="${idx}" />
          <span class="text-slate-400 dark:text-slate-500 line-through text-sm">${text}</span>
        </div>`;
      }

      // Headers
      if (escaped.startsWith('### ')) {
        return `<h3 class="text-lg font-bold text-slate-900 dark:text-white mt-5 mb-2">${escaped.slice(4)}</h3>`;
      }
      if (escaped.startsWith('## ')) {
        return `<h2 class="text-xl font-bold text-slate-900 dark:text-white mt-6 mb-2.5 pb-1 border-b border-slate-100 dark:border-slate-800">${escaped.slice(3)}</h2>`;
      }
      if (escaped.startsWith('# ')) {
        return `<h1 class="text-2xl font-black text-slate-900 dark:text-white mt-8 mb-3 pb-2 border-b border-slate-200 dark:border-slate-700">${escaped.slice(2)}</h1>`;
      }

      // Blockquotes / Callouts
      if (escaped.startsWith('> [!NOTE]')) {
        return `<div class="p-3 my-3 bg-blue-50 dark:bg-blue-950/40 border-l-4 border-blue-500 text-blue-900 dark:text-blue-300 rounded-r-xl text-xs sm:text-sm font-medium">💡 <strong>Note:</strong> ${escaped.slice(9)}</div>`;
      }
      if (escaped.startsWith('> [!TIP]')) {
        return `<div class="p-3 my-3 bg-emerald-50 dark:bg-emerald-950/40 border-l-4 border-emerald-500 text-emerald-900 dark:text-emerald-300 rounded-r-xl text-xs sm:text-sm font-medium">✨ <strong>Tip:</strong> ${escaped.slice(8)}</div>`;
      }
      if (escaped.startsWith('> [!WARNING]')) {
        return `<div class="p-3 my-3 bg-amber-50 dark:bg-amber-950/40 border-l-4 border-amber-500 text-amber-900 dark:text-amber-300 rounded-r-xl text-xs sm:text-sm font-medium">⚠️ <strong>Warning:</strong> ${escaped.slice(12)}</div>`;
      }
      if (escaped.startsWith('> ')) {
        return `<blockquote class="border-l-4 border-indigo-500 pl-4 py-1 my-2 text-slate-600 dark:text-slate-400 italic text-sm">${escaped.slice(2)}</blockquote>`;
      }

      // Horizontal Divider
      if (escaped.trim() === '---') {
        return `<hr class="my-6 border-slate-200 dark:border-slate-800" />`;
      }

      // Bullet lists
      if (escaped.trim().startsWith('- ')) {
        return `<li class="ml-5 list-disc text-slate-700 dark:text-slate-300 text-sm my-1">${escaped.trim().slice(2)}</li>`;
      }

      // Inline styles: Bold, Italic, Inline Code
      let inline = escaped
        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900 dark:text-white">$1</strong>')
        .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
        .replace(/~~(.*?)~~/g, '<span class="line-through text-slate-400">$1</span>')
        .replace(/`(.*?)`/g, '<code class="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-xs text-rose-500 dark:text-rose-400">$1</code>')
        .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noreferrer" class="text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 font-medium">$1</a>');

      if (inline.trim() === '') {
        return '<div class="h-2"></div>';
      }

      return `<p class="my-1 text-slate-700 dark:text-slate-300 text-sm leading-relaxed">${inline}</p>`;
    });

    return processedLines.join('');
  };

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      onKeyDown={handleKeyDown}
      className={`fixed inset-0 z-[130] bg-slate-950/80 backdrop-blur-md flex flex-col transition-all duration-200 select-none ${
        isFullscreen ? 'p-0' : 'p-2 sm:p-4 md:p-6'
      }`}
    >
      <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 w-full h-full rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-900 dark:text-slate-100">
        {/* ========================================================= */}
        {/* TOP NAVIGATION BAR (Linear / Google Docs Tier)             */}
        {/* ========================================================= */}
        <header className="h-14 border-b border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between gap-3 bg-white/80 dark:bg-[#0F172A]/90 backdrop-blur shrink-0">
          {/* Left: File Title & Icon */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0">
              <FileText className="w-4 h-4" />
            </div>

            <div className="flex items-center gap-2 min-w-0">
              {isRenaming ? (
                <input
                  type="text"
                  autoFocus
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  onBlur={() => setIsRenaming(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') setIsRenaming(false);
                  }}
                  className="px-2 py-0.5 text-sm font-bold bg-slate-100 dark:bg-slate-800 border border-indigo-500 rounded-md focus:outline-none"
                />
              ) : (
                <button
                  onClick={() => permission === 'EDIT' && setIsRenaming(true)}
                  className="text-sm font-bold text-slate-900 dark:text-white truncate hover:bg-slate-100 dark:hover:bg-slate-800 px-2 py-1 rounded-md transition text-left cursor-pointer"
                  title="Click to rename"
                >
                  {docTitle}
                </button>
              )}

              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-mono text-[11px] shrink-0">
                v{docVersion}
              </span>

              {permission === 'VIEW' && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 font-semibold shrink-0">
                  🔒 View Only
                </span>
              )}
            </div>
          </div>

          {/* Middle: Save Status Pill & Document Stats */}
          <div className="hidden md:flex items-center gap-3">
            {/* Status Pill */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition ${
                syncStatus === 'SAVED'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                  : syncStatus === 'SAVING'
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                  : syncStatus === 'DIRTY'
                  ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
              }`}
            >
              {syncStatus === 'SAVED' && (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Saved to cloud</span>
                </>
              )}
              {syncStatus === 'SAVING' && (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving changes...</span>
                </>
              )}
              {syncStatus === 'DIRTY' && (
                <>
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  <span>Unsaved changes</span>
                </>
              )}
              {syncStatus === 'ERROR' && (
                <>
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Save failed</span>
                </>
              )}
            </div>

            {/* Stats */}
            <div className="text-[11px] text-slate-400 flex items-center gap-2">
              <span>{stats.words} words</span>
              <span>•</span>
              <span>{stats.readTimeMinutes} min read</span>
            </div>
          </div>

          {/* Right: Collaborator Avatars & Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Live Multiplayer Collaborators */}
            <div className="flex items-center -space-x-2 mr-2">
              {/* Self Avatar */}
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white ring-2 bg-indigo-600 shadow-sm relative group cursor-pointer"
                style={{ ringColor: selfColor }}
                title={`${currentUser?.username || 'You'} (You)`}
              >
                {currentUser?.username?.[0]?.toUpperCase() || 'Y'}
                <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white dark:ring-slate-900" />
              </div>

              {/* Remote Active Peers */}
              {activePeers.slice(0, 4).map((peer) => (
                <div
                  key={peer.socketId}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white ring-2 shadow-sm relative group cursor-pointer animate-scale-up"
                  style={{
                    backgroundColor: peer.color || '#6366F1',
                    ringColor: peer.color || '#6366F1',
                  }}
                  title={`${peer.username} (${peer.email || 'Collaborating'})`}
                >
                  {peer.username?.[0]?.toUpperCase() || 'U'}
                  <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white dark:ring-slate-900" />
                </div>
              ))}

              {activePeers.length > 4 && (
                <div className="w-7 h-7 rounded-full bg-slate-700 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-slate-800">
                  +{activePeers.length - 4}
                </div>
              )}
            </div>

            {/* Version Time Machine Button */}
            <button
              onClick={() => {
                setShowVersions(!showVersions);
                setShowComments(false);
              }}
              className={`p-2 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${
                showVersions
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title="Revision History & Time Machine"
            >
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">History</span>
            </button>

            {/* Comments Button */}
            <button
              onClick={() => {
                setShowComments(!showComments);
                setShowVersions(false);
              }}
              className={`p-2 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${
                showComments
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title="Threaded Document Comments"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Comments</span>
              {comments.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {comments.length}
                </span>
              )}
            </button>

            {/* Export Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowExport(!showExport)}
                className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                title="Export Document"
              >
                <Download className="w-4 h-4" />
              </button>

              {showExport && (
                <div className="absolute right-0 top-11 z-[140] w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1 animate-fade-in text-xs">
                  <button
                    onClick={() => exportAsFile('md')}
                    className="w-full text-left px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                  >
                    <FileDown className="w-3.5 h-3.5 text-indigo-500" />
                    Download Markdown (.md)
                  </button>
                  <button
                    onClick={() => exportAsFile('txt')}
                    className="w-full text-left px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-500" />
                    Download Plain Text (.txt)
                  </button>
                  <button
                    onClick={() => exportAsFile('html')}
                    className="w-full text-left px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                  >
                    <Code className="w-3.5 h-3.5 text-emerald-500" />
                    Export Formatted HTML (.html)
                  </button>
                  <div className="border-t border-slate-100 dark:border-slate-800 my-1" />
                  <button
                    onClick={handlePrint}
                    className="w-full text-left px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-purple-500" />
                    Print / Save as PDF
                  </button>
                </div>
              )}
            </div>

            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Close Workspace"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* ========================================================= */}
        {/* FORMATTING & PRODUCTIVITY TOOLBAR                         */}
        {/* ========================================================= */}
        <div className="h-11 border-b border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between gap-2 bg-slate-50/70 dark:bg-[#0B1120] text-slate-600 dark:text-slate-300 text-xs shrink-0 overflow-x-auto">
          {/* Left: Typography & Formatting Tools */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={permission !== 'EDIT'}
              onClick={() => insertLinePrefix('# ')}
              className="px-2 py-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 font-bold transition cursor-pointer disabled:opacity-30"
              title="Heading 1"
            >
              H1
            </button>
            <button
              type="button"
              disabled={permission !== 'EDIT'}
              onClick={() => insertLinePrefix('## ')}
              className="px-2 py-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 font-bold transition cursor-pointer disabled:opacity-30"
              title="Heading 2"
            >
              H2
            </button>
            <button
              type="button"
              disabled={permission !== 'EDIT'}
              onClick={() => insertLinePrefix('### ')}
              className="px-2 py-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 font-bold transition cursor-pointer disabled:opacity-30"
              title="Heading 3"
            >
              H3
            </button>

            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />

            <button
              type="button"
              disabled={permission !== 'EDIT'}
              onClick={() => insertFormatting('**', '**', 'bold')}
              className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer disabled:opacity-30"
              title="Bold (Ctrl+B)"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              disabled={permission !== 'EDIT'}
              onClick={() => insertFormatting('*', '*', 'italic')}
              className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer disabled:opacity-30"
              title="Italic (Ctrl+I)"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              disabled={permission !== 'EDIT'}
              onClick={() => insertFormatting('~~', '~~', 'strikethrough')}
              className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer disabled:opacity-30"
              title="Strikethrough"
            >
              <Strikethrough className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              disabled={permission !== 'EDIT'}
              onClick={() => insertFormatting('`', '`', 'code')}
              className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer disabled:opacity-30"
              title="Inline Code"
            >
              <Code className="w-3.5 h-3.5" />
            </button>

            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />

            {/* Interactive Task Checklist (Linear Style) */}
            <button
              type="button"
              disabled={permission !== 'EDIT'}
              onClick={() => insertLinePrefix('- [ ] ')}
              className="flex items-center gap-1 px-2 py-1 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition font-medium cursor-pointer disabled:opacity-30"
              title="Insert Interactive Checklist"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Task</span>
            </button>

            <button
              type="button"
              disabled={permission !== 'EDIT'}
              onClick={() => insertLinePrefix('- ')}
              className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer disabled:opacity-30"
              title="Bullet List"
            >
              <List className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              disabled={permission !== 'EDIT'}
              onClick={() => insertLinePrefix('> ')}
              className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer disabled:opacity-30"
              title="Blockquote"
            >
              <Quote className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              disabled={permission !== 'EDIT'}
              onClick={() => insertLinePrefix('---\n')}
              className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer disabled:opacity-30"
              title="Divider"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Right: View Mode Selector & Undo/Redo */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={permission !== 'EDIT'}
              onClick={handleUndo}
              className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer disabled:opacity-30"
              title="Undo (Ctrl+Z)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              disabled={permission !== 'EDIT'}
              onClick={handleRedo}
              className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer disabled:opacity-30"
              title="Redo (Ctrl+Y)"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>

            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />

            {/* View Mode Buttons */}
            <div className="flex items-center bg-slate-200/70 dark:bg-slate-800 p-0.5 rounded-lg">
              <button
                type="button"
                onClick={() => setViewMode('editor')}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                  viewMode === 'editor'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Edit3 className="w-3 h-3" />
                <span>Editor</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('split')}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                  viewMode === 'split'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Columns className="w-3 h-3" />
                <span>Split</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('preview')}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                  viewMode === 'preview'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Eye className="w-3 h-3" />
                <span>Preview</span>
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* MAIN WORKSPACE CANVAS                                     */}
        {/* ========================================================= */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Main Content Area */}
          <div className="flex-1 flex overflow-hidden">
            {isLoading ? (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                <p className="text-sm font-medium text-slate-500">Connecting to collaborative session...</p>
              </div>
            ) : (
              <>
                {/* 1. Raw Text Editor */}
                {(viewMode === 'editor' || viewMode === 'split') && (
                  <div
                    className={`h-full flex flex-col relative ${
                      viewMode === 'split' ? 'w-1/2 border-r border-slate-200 dark:border-slate-800' : 'w-full'
                    }`}
                  >
                    <textarea
                      ref={textareaRef}
                      value={content}
                      readOnly={permission !== 'EDIT'}
                      onChange={(e) => handleContentChange(e.target.value)}
                      onSelect={handleCursorMove}
                      onClick={handleCursorMove}
                      onKeyUp={handleCursorMove}
                      placeholder="Start typing markdown, code, or documentation..."
                      className="w-full h-full p-6 bg-transparent text-slate-900 dark:text-slate-100 font-mono text-xs sm:text-sm leading-relaxed resize-none focus:outline-none select-text"
                      spellCheck="false"
                    />

                    {/* Remote Cursor Indicators Over Textarea */}
                    {activePeers.map((peer) => {
                      if (!peer.cursor) return null;
                      return (
                        <div
                          key={peer.socketId}
                          className="absolute pointer-events-none transition-all duration-75"
                          style={{
                            top: 24,
                            right: 24,
                          }}
                        >
                          <span
                            className="text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm text-white flex items-center gap-1"
                            style={{ backgroundColor: peer.color }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                            {peer.username}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 2. Live Formatted Preview (with interactive task toggles) */}
                {(viewMode === 'preview' || viewMode === 'split') && (
                  <div
                    className={`h-full overflow-y-auto p-8 bg-slate-50/40 dark:bg-slate-900/30 ${
                      viewMode === 'split' ? 'w-1/2' : 'w-full max-w-4xl mx-auto'
                    }`}
                    onClick={(e) => {
                      // Delegate checkbox toggle event to task lines
                      if (e.target.type === 'checkbox' && permission === 'EDIT') {
                        const lineIdx = Number(e.target.getAttribute('data-line-index'));
                        if (!isNaN(lineIdx)) {
                          handleToggleTask(lineIdx);
                        }
                      }
                    }}
                  >
                    <div
                      className="prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-200"
                      dangerouslySetInnerHTML={{
                        __html: renderMarkdownToHtml(content),
                      }}
                    />
                  </div>
                )}
              </>
            )}
          </div>

          {/* ========================================================= */}
          {/* VERSION TIME MACHINE DRAWER (Linear / Figma Style)         */}
          {/* ========================================================= */}
          {showVersions && (
            <aside className="w-80 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col shadow-xl z-20 animate-slide-in-right">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-500" />
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Revision Time Machine</h4>
                </div>
                <button
                  onClick={() => setShowVersions(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {/* Current Active Version Card */}
                <div className="p-3 rounded-xl border-2 border-indigo-500/50 bg-indigo-50/40 dark:bg-indigo-950/20">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Current (v{docVersion})</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-semibold">
                      Live
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {lastSavedTime ? `Saved ${lastSavedTime.toLocaleTimeString()}` : 'Actively editing'}
                  </p>
                </div>

                {loadingVersions ? (
                  <div className="flex items-center justify-center p-6 text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                ) : versions.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">No previous versions yet.</p>
                ) : (
                  versions.map((v) => {
                    const isSelected = selectedVersion?.id === v.id;
                    return (
                      <div
                        key={v.id}
                        onClick={() => setSelectedVersion(isSelected ? null : v)}
                        className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 shadow-xs'
                            : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            Version {v.versionNumber}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {(v.size / 1024).toFixed(1)} KB
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                          {new Date(v.createdAt).toLocaleString()}
                        </p>

                        {isSelected && (
                          <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-2">
                            <button
                              type="button"
                              disabled={isRestoring}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRestoreVersion(v);
                              }}
                              className="px-3 py-1 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                            >
                              {isRestoring ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                              Restore Version
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </aside>
          )}

          {/* ========================================================= */}
          {/* THREADED COMMENTS DRAWER (Google Docs / Linear Style)      */}
          {/* ========================================================= */}
          {showComments && (
            <aside className="w-80 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col shadow-xl z-20 animate-slide-in-right">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-indigo-500" />
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Document Comments</h4>
                </div>
                <button
                  onClick={() => setShowComments(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Comment Thread List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {comments.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-xs">No comments yet.</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Start a discussion with your team!</p>
                  </div>
                ) : (
                  comments.map((c) => (
                    <div
                      key={c.id}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {c.user?.username || 'User'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{c.content}</p>
                    </div>
                  ))
                )}
              </div>

              {/* New Comment Input */}
              <form onSubmit={handleAddComment} className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={!newComment.trim()}
                    className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 transition cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
