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
import { useCrypto } from '../../context/CryptoContext';
import {
  decryptSymmetricKeyWithRsa,
  decryptBuffer,
  generateSymmetricKey,
  encryptBuffer,
  encryptString,
  encryptSymmetricKeyWithRsa,
  importRsaPublicKeyFromJwk
} from '../../utils/cryptoHelper';

const FilePreviewModal = ({
  file,
  isOpen,
  onClose,
  onToast,
  loadFiles
}) => {
  const user = useSelector((state) => state.auth.user);
  const [activeFile, setActiveFile] = useState(file);
  const [comments, setComments] = useState([]);

  // E2EE hooks and states
  const { isE2eeSetup, isE2eeUnlocked, privateKey } = useCrypto();
  const [decryptedUrl, setDecryptedUrl] = useState(null);
  const [decryptedLoading, setDecryptedLoading] = useState(false);

  useEffect(() => {
    let active = true;
    let localUrl = null;

    const decryptFileForPreview = async () => {
      if (!activeFile) {
        setDecryptedUrl(null);
        return;
      }

      if (activeFile.isEncrypted) {
        if (!isE2eeUnlocked || !privateKey) {
          setDecryptedUrl(null);
          return;
        }

        setDecryptedLoading(true);
        try {
          // 1. Fetch encrypted bytes
          const response = await fetch(activeFile.url);
          if (!response.ok) throw new Error("Failed to fetch file content");
          const encryptedBuffer = await response.arrayBuffer();

          // 2. Decrypt symmetric key
          const fileKey = await decryptSymmetricKeyWithRsa(activeFile.encryptedKey, privateKey);

          // 3. Decrypt data
          const decryptedBuffer = await decryptBuffer(encryptedBuffer, fileKey, activeFile.fileIv);

          // 4. Create blob and object URL
          const decryptedBlob = new Blob([decryptedBuffer], { type: activeFile.mimeType || "application/octet-stream" });
          localUrl = URL.createObjectURL(decryptedBlob);

          if (active) {
            setDecryptedUrl(localUrl);
          }
        } catch (err) {
          console.error("Preview decryption error:", err);
          if (active) {
            setDecryptedUrl(null);
          }
        } finally {
          if (active) {
            setDecryptedLoading(false);
          }
        }
      } else {
        setDecryptedUrl(activeFile.url);
      }
    };

    decryptFileForPreview();

    return () => {
      active = false;
      if (localUrl) {
        URL.revokeObjectURL(localUrl);
      }
    };
  }, [activeFile, isE2eeUnlocked, privateKey]);
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

  // --- NEW STATES FOR ADVANCED DOCUMENT & MEDIA TOOLS ---
  const [editorContent, setEditorContent] = useState("");
  const [originalContent, setOriginalContent] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [viewMode, setViewMode] = useState("preview"); // "preview" or "editor"

  const [annotationMode, setAnnotationMode] = useState(null); // null, "draw", "highlight", "comment"
  const [annotations, setAnnotations] = useState([]);
  const [canvasWidth, setCanvasWidth] = useState(800);
  const [canvasHeight, setCanvasHeight] = useState(600);
  const [isDrawing, setIsDrawing] = useState(false);

  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [savedTime, setSavedTime] = useState(0);

  // --- VERSION COMPARE STATES ---
  const [compareVersion, setCompareVersion] = useState(null);
  const [compareTextA, setCompareTextA] = useState("");
  const [compareTextB, setCompareTextB] = useState("");
  const [loadingCompare, setLoadingCompare] = useState(false);

  const mediaRef = useRef(null);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const fileId = activeFile?.id || activeFile?._id || file?.id || file?._id;
  const maxVersionNumber = versions.length > 0 ? Math.max(...versions.map(ver => ver.versionNumber)) : 0;

  const addToast = (msg, type) => {
    if (onToast) onToast(msg, type);
    else console.log(`[Toast] [${type}] ${msg}`);
  };

  useEffect(() => {
    if (file) {
      setActiveFile(file);
      setIsEditing(false);
      setViewMode("preview");
      setAnnotationMode(null);
      setAnnotations([]);
      setShowResumePrompt(false);
      setCompareVersion(null);
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

  const mime = activeFile?.mimeType || '';
  const url = decryptedUrl;

  const ext = activeFile?.originalName ? activeFile.originalName.split('.').pop().toLowerCase() : '';

  // FILE TYPES
  const isImage = mime.includes('image') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'].includes(ext);
  const isVideo = mime.includes('video') || ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv'].includes(ext);
  const isAudio = mime.includes('audio') || ['mp3', 'wav', 'm4a', 'aac', 'flac', 'ogg'].includes(ext);
  const isPdf = mime.includes('pdf') || ext === 'pdf';

  const isText =
    mime.includes('text') ||
    mime.includes('json') ||
    mime.includes('javascript') ||
    mime.includes('html') ||
    mime.includes('css') ||
    mime.includes('xml') ||
    ['txt', 'md', 'markdown', 'json', 'js', 'jsx', 'ts', 'tsx', 'html', 'css', 'xml', 'py', 'java', 'cpp', 'c', 'sh', 'yml', 'yaml'].includes(ext);

  const isOffice =
    mime.includes('word') ||
    mime.includes('excel') ||
    mime.includes('spreadsheet') ||
    mime.includes('powerpoint') ||
    mime.includes('presentation') ||
    ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext);

  const isArchive =
    mime.includes('zip') ||
    mime.includes('rar') ||
    mime.includes('7z');

  // --- AUDIO / VIDEO PLAYBACK POSITION TRACKING ---
  useEffect(() => {
    if (isOpen && fileId && (isVideo || isAudio)) {
      const stored = localStorage.getItem(`datastock-playback-${fileId}`);
      if (stored) {
        const time = parseFloat(stored);
        if (time > 3) {
          setSavedTime(time);
          setShowResumePrompt(true);
        }
      }
    } else {
      setShowResumePrompt(false);
    }
  }, [isOpen, fileId, isVideo, isAudio]);

  const handleResumePlayback = () => {
    if (mediaRef.current) {
      mediaRef.current.currentTime = savedTime;
      mediaRef.current.play().catch(() => {});
    }
    setShowResumePrompt(false);
  };

  const handleTimeUpdate = () => {
    if (mediaRef.current && fileId) {
      const curr = mediaRef.current.currentTime;
      const duration = mediaRef.current.duration;
      if (curr > 3 && duration && duration - curr > 5) {
        localStorage.setItem(`datastock-playback-${fileId}`, curr.toString());
      } else if (duration && duration - curr <= 5) {
        localStorage.removeItem(`datastock-playback-${fileId}`);
      }
    }
  };

  const formatPlaybackTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // --- CODE & MARKDOWN EDITOR ---
  useEffect(() => {
    if (isOpen && isText && url) {
      setPreviewLoading(true);
      fetch(url)
        .then((res) => {
          if (!res.ok) throw new Error("Network response not ok");
          return res.text();
        })
        .then((text) => {
          setEditorContent(text);
          setOriginalContent(text);
          setPreviewLoading(false);
        })
        .catch((err) => {
          console.error("Error loading text file content:", err);
          setPreviewLoading(false);
        });
    }
  }, [isOpen, fileId, isText, url]);

  const handleSaveContent = async () => {
    if (editorContent === originalContent) {
      addToast("No changes to save.", "info");
      return;
    }
    setIsSaving(true);
    try {
      let fileObj = null;
      let isEncryptedSave = false;
      let e2eeFields = {};

      if (activeFile.isEncrypted) {
        if (!isE2eeUnlocked || !privateKey) {
          addToast("Secure storage is locked. Cannot save changes.", "error");
          setIsSaving(false);
          return;
        }
        isEncryptedSave = true;
        const encoder = new TextEncoder();
        const textBuffer = encoder.encode(editorContent).buffer;

        const fileKey = await generateSymmetricKey();
        const encResult = await encryptBuffer(textBuffer, fileKey);
        const encNameResult = await encryptString(activeFile.originalName, fileKey);
        
        const rsaPublicKey = await importRsaPublicKeyFromJwk(user.publicKey);
        const encFileKey = await encryptSymmetricKeyWithRsa(fileKey, rsaPublicKey);

        const encryptedBlob = new Blob([encResult.ciphertext], { type: "application/octet-stream" });
        const randomSuffix = Math.random().toString(36).substring(2, 10);
        const encFileName = `datastock_e2ee_${Date.now()}_${randomSuffix}.enc`;

        fileObj = new File([encryptedBlob], encFileName, { type: "application/octet-stream" });

        e2eeFields = {
          isEncrypted: true,
          encryptedKey: encFileKey,
          fileIv: encResult.iv,
          nameIv: encNameResult.iv,
          encryptedName: encNameResult.ciphertext
        };
      } else {
        const blob = new Blob([editorContent], { type: mime || "text/plain" });
        fileObj = new File([blob], activeFile.originalName, { type: mime || "text/plain" });
      }
      
      const formData = new FormData();
      formData.append("file", fileObj);
      formData.append("fileId", fileId);

      if (isEncryptedSave) {
        formData.append("isEncrypted", "true");
        formData.append("encryptedKey", e2eeFields.encryptedKey);
        formData.append("fileIv", e2eeFields.fileIv);
        formData.append("nameIv", e2eeFields.nameIv);
        formData.append("encryptedName", e2eeFields.encryptedName);
        formData.append("originalMimeType", mime || "text/plain");
      }

      const res = await authFetch(apiUrl("/files"), {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setOriginalContent(editorContent);
        setActiveFile(data.file);
        addToast("Changes saved successfully!", "success");
        setIsEditing(false);
        if (loadFiles) loadFiles();
        loadVersions();
      } else {
        addToast(data.message || "Failed to save changes.", "error");
      }
    } catch (error) {
      console.error("Error saving file content:", error);
      addToast("Failed to save changes.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const renderMarkdown = (text) => {
    if (!text) return <p className="text-gray-400 italic">Empty markdown document</p>;
    let html = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    
    // Bold / Italics
    html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
    
    // Headers
    html = html.replace(/^### (.*?)$/gm, "<h4 class='text-lg font-bold text-gray-900 dark:text-[#F8FAFC] mt-4 mb-2'>$1</h4>");
    html = html.replace(/^## (.*?)$/gm, "<h3 class='text-xl font-bold text-gray-900 dark:text-[#F8FAFC] mt-5 mb-2'>$1</h3>");
    html = html.replace(/^# (.*?)$/gm, "<h2 class='text-2xl font-black text-gray-900 dark:text-[#F8FAFC] mt-6 mb-3'>$1</h2>");
    
    // Code blocks
    html = html.replace(/```([\s\S]*?)```/g, "<pre class='bg-gray-50 dark:bg-[#1E293B] p-4 rounded-xl font-mono text-xs my-4 overflow-x-auto border border-gray-200 dark:border-[#334155] text-gray-800 dark:text-[#F8FAFC]'>$1</pre>");
    html = html.replace(/`(.*?)`/g, "<code class='bg-gray-150 dark:bg-[#334155] px-1.5 py-0.5 rounded font-mono text-xs text-red-650 dark:text-red-400'>$1</code>");
    
    // Links
    html = html.replace(/\[(.*?)\]\((.*?)\)/g, "<a href='$2' target='_blank' rel='noreferrer' class='text-emerald-600 dark:text-emerald-450 hover:underline'>$1</a>");
    
    // Unordered lists
    html = html.replace(/^\s*-\s+(.*?)$/gm, "<li class='list-disc ml-5 my-1 text-gray-700 dark:text-[#94A3B8]'>$1</li>");
    
    // Line breaks
    html = html.split('\n').map(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('<li') || trimmed.startsWith('<h') || trimmed.startsWith('<pre') || trimmed.startsWith('</pre') || trimmed === '') {
        return line;
      }
      return line + '<br/>';
    }).join('\n');

    return (
      <div className="prose dark:prose-invert max-w-none text-gray-800 dark:text-gray-250 p-6 leading-relaxed select-text" dangerouslySetInnerHTML={{ __html: html }} />
    );
  };

  // --- PDF INTERACTIVE ANNOTATION CANVAS ---
  useEffect(() => {
    if (annotationMode && containerRef.current) {
      setCanvasWidth(containerRef.current.clientWidth);
      setCanvasHeight(containerRef.current.clientHeight);
    }
  }, [annotationMode, activeFile]);

  useEffect(() => {
    if (canvasRef.current && annotationMode) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      annotations.forEach(ann => {
        ctx.beginPath();
        ctx.strokeStyle = ann.color;
        ctx.lineWidth = ann.width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        if (ann.points.length > 0) {
          ctx.moveTo(ann.points[0].x, ann.points[0].y);
          for (let i = 1; i < ann.points.length; i++) {
            ctx.lineTo(ann.points[i].x, ann.points[i].y);
          }
          ctx.stroke();
        }
      });
    }
  }, [annotations, annotationMode, canvasWidth, canvasHeight]);

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsDrawing(true);
    const newAnn = {
      type: annotationMode === 'highlight' ? 'highlight' : 'draw',
      color: annotationMode === 'highlight' ? 'rgba(253, 224, 71, 0.45)' : '#10b981',
      width: annotationMode === 'highlight' ? 18 : 3,
      points: [{ x, y }]
    };
    setAnnotations([...annotations, newAnn]);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newAnns = [...annotations];
    const currentAnn = newAnns[newAnns.length - 1];
    if (currentAnn) {
      currentAnn.points.push({ x, y });
      setAnnotations(newAnns);
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleCompareClick = (v) => {
    setCompareVersion(v);
    if (isText) {
      setLoadingCompare(true);
      Promise.all([
        fetch(v.url).then((res) => res.text()),
        fetch(activeFile.url).then((res) => res.text())
      ])
        .then(([textA, textB]) => {
          setCompareTextA(textA);
          setCompareTextB(textB);
          setLoadingCompare(false);
        })
        .catch((err) => {
          console.error("Error loading diff files:", err);
          addToast("Failed to load text content for comparison.", "error");
          setLoadingCompare(false);
          setCompareVersion(null);
        });
    }
  };

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

  if (!isOpen || !activeFile) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl w-full max-w-6xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col md:flex-row transition-colors duration-200">
        
        {/* LEFT COLUMN: PREVIEW + HEADER */}
        <div className={`flex-1 flex flex-col min-w-0 ${activeMobileTab === "preview" ? "flex" : "hidden md:flex"}`}>
          
          {/* LEFT HEADER */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-[#334155] bg-white dark:bg-[#1E293B] shrink-0 gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-gray-900 dark:text-[#F8FAFC] truncate">
                {file.originalName}
              </h2>
              <p className="text-sm text-gray-500 dark:text-[#94A3B8]">
                {mime}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Mobile Toggle Button to view comments */}
              <button
                type="button"
                onClick={() => setActiveMobileTab("comments")}
                className="p-2 hover:bg-gray-100 dark:hover:bg-[#334155] rounded-lg transition md:hidden relative"
                title="View Comments"
              >
                <MessageSquare className="w-5 h-5 text-gray-600 dark:text-[#94A3B8]" />
                {comments.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#3B82F6] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                    {comments.length}
                  </span>
                )}
              </button>

              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                download
                className="p-2 hover:bg-gray-100 dark:hover:bg-[#334155] rounded-lg transition"
              >
                <Download className="w-5 h-5 text-gray-600 dark:text-[#94A3B8]" />
              </a>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-[#334155] rounded-lg transition"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-[#94A3B8]" />
              </button>
            </div>
          </div>

          {/* CONTENT PREVIEW */}
          <div className="bg-gray-100 dark:bg-[#0F172A] flex-1 flex items-center justify-center overflow-auto min-h-[45vh] md:min-h-0 relative">
            {/* PREVIEW LOADER OVERLAY */}
            {previewLoading && (
              <div className="absolute inset-0 bg-white/70 dark:bg-[#0F172A]/70 backdrop-blur-xs flex flex-col items-center justify-center z-20 transition-all duration-200">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-2" />
                <span className="text-xs font-semibold text-gray-550 dark:text-[#94A3B8] animate-pulse select-none">Loading preview...</span>
              </div>
            )}

            {/* VERSION COMPARE VIEW */}
            {compareVersion ? (
              <div className="w-full h-full flex flex-col bg-white dark:bg-[#0F172A] animate-fade-in">
                {/* Compare Toolbar */}
                <div className="bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between shrink-0 text-xs border-b border-slate-800 select-none">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#3B82F6]">Comparing:</span>
                    <span className="text-slate-350">Version {compareVersion.versionNumber} vs Current Version</span>
                  </div>
                  <button
                    onClick={() => setCompareVersion(null)}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded font-bold transition flex items-center gap-1"
                  >
                    Back to Preview
                  </button>
                </div>

                <div className="flex-1 overflow-hidden h-full">
                  {isImage && (
                    <div className="flex h-full w-full divide-x divide-gray-200 dark:divide-slate-800 bg-white dark:bg-[#0F172A] p-6 gap-6 overflow-auto">
                      <div className="flex-1 flex flex-col items-center justify-center min-w-0">
                        <span className="text-xs font-bold text-gray-400 dark:text-[#94A3B8] uppercase tracking-wider mb-3">Version {compareVersion.versionNumber}</span>
                        <div className="border border-dashed border-gray-200 dark:border-[#334155] rounded-2xl p-2 bg-gray-50/50 dark:bg-[#1E293B]/50 max-h-[50vh] flex items-center justify-center">
                          <img src={compareVersion.url} className="max-h-full max-w-full object-contain rounded-xl" />
                        </div>
                        <span className="text-[10px] text-gray-400 mt-2 select-none">Uploaded {new Date(compareVersion.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex-1 flex flex-col items-center justify-center min-w-0 pl-6">
                        <span className="text-xs font-bold text-emerald-500 dark:text-emerald-450 uppercase tracking-wider mb-3">Current Version</span>
                        <div className="border border-dashed border-gray-200 dark:border-[#334155] rounded-2xl p-2 bg-gray-50/50 dark:bg-[#1E293B]/50 max-h-[50vh] flex items-center justify-center">
                          <img src={activeFile.url} className="max-h-full max-w-full object-contain rounded-xl" />
                        </div>
                        <span className="text-[10px] text-gray-455 mt-2 select-none">Uploaded {new Date(activeFile.updatedAt || activeFile.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  )}

                  {isText && (
                    loadingCompare ? (
                      <div className="flex flex-col items-center justify-center h-full gap-2">
                        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                        <span className="text-xs text-gray-450">Comparing file differences…</span>
                      </div>
                    ) : (
                      <div className="flex h-full w-full divide-x divide-slate-800 bg-slate-950 font-mono text-xs overflow-auto select-text text-left">
                        {/* Version A (Past) */}
                        <div className="flex-1 overflow-auto p-4 space-y-0.5 leading-relaxed min-w-[50%]">
                          <div className="text-[10px] font-bold text-red-400 uppercase tracking-wider border-b border-slate-850 pb-2 mb-2 select-none">Version {compareVersion.versionNumber}</div>
                          {compareTextA.split('\n').map((line, idx) => {
                            const otherLine = compareTextB.split('\n')[idx];
                            const isDiff = line !== otherLine;
                            return (
                              <div key={idx} className={`flex ${isDiff ? 'bg-red-950/40 text-red-305 border-l-2 border-red-500 pl-1.5' : 'text-slate-450 pl-2'}`}>
                                <span className="w-6 shrink-0 text-right pr-2 text-slate-600 select-none">{idx + 1}</span>
                                <span className="whitespace-pre overflow-x-auto">{line || ' '}</span>
                              </div>
                            );
                          })}
                        </div>
                        {/* Version B (Current) */}
                        <div className="flex-1 overflow-auto p-4 space-y-0.5 leading-relaxed pl-4 min-w-[50%]">
                          <div className="text-[10px] font-bold text-[#3B82F6] uppercase tracking-wider border-b border-slate-850 pb-2 mb-2 select-none">Current Version</div>
                          {compareTextB.split('\n').map((line, idx) => {
                            const otherLine = compareTextA.split('\n')[idx];
                            const isDiff = line !== otherLine;
                            return (
                              <div key={idx} className={`flex ${isDiff ? 'bg-emerald-950/45 text-emerald-305 border-l-2 border-emerald-500 pl-1.5' : 'text-slate-350 pl-2'}`}>
                                <span className="w-6 shrink-0 text-right pr-2 text-slate-600 select-none">{idx + 1}</span>
                                <span className="whitespace-pre overflow-x-auto">{line || ' '}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            ) : (
              <>
                {/* Media Playback Resume Prompt */}
                {showResumePrompt && (
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900/90 dark:bg-[#0F172A]/95 backdrop-blur-md border border-slate-800 text-white px-4 py-2.5 rounded-xl flex items-center gap-3 z-30 shadow-lg text-xs animate-fade-down">
                    <span className="font-medium">Resume from {formatPlaybackTime(savedTime)}?</span>
                    <div className="flex gap-2">
                      <button onClick={handleResumePlayback} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1 rounded">Yes</button>
                      <button onClick={() => setShowResumePrompt(false)} className="bg-slate-700 hover:bg-slate-650 text-slate-300 px-2.5 py-1 rounded">No</button>
                    </div>
                  </div>
                )}

                {/* IMAGE */}
                {isImage && (
                  <img
                    src={url}
                    alt={file.originalName}
                    className="max-h-full max-w-full object-contain animate-fade-in"
                    onLoad={() => setPreviewLoading(false)}
                    onError={() => setPreviewLoading(false)}
                  />
                )}

                {/* VIDEO */}
                {isVideo && (
                  <video
                    ref={mediaRef}
                    controls
                    onTimeUpdate={handleTimeUpdate}
                    className="max-h-full max-w-full rounded-xl shadow-md"
                    onLoadedData={() => setPreviewLoading(false)}
                    onError={() => setPreviewLoading(false)}
                  >
                    <source src={url} type={mime} />
                  </video>
                )}

                {/* AUDIO */}
                {isAudio && (
                  <div className="bg-white dark:bg-[#1E293B] p-10 rounded-2xl shadow-lg text-center border border-gray-100 dark:border-[#334155] w-80 max-w-full">
                    <FileAudio className="w-20 h-20 mx-auto text-pink-500 mb-4 animate-bounce" style={{ animationDuration: '3s' }} />
                    <p className="text-sm font-semibold mb-4 text-gray-800 dark:text-gray-250 truncate">
                      {activeFile.originalName}
                    </p>
                    <audio
                      ref={mediaRef}
                      controls
                      onTimeUpdate={handleTimeUpdate}
                      className="w-full"
                      onLoadedData={() => setPreviewLoading(false)}
                      onError={() => setPreviewLoading(false)}
                    >
                      <source src={url} type={mime} />
                    </audio>
                  </div>
                )}

                {/* PDF WITH MARKUP ANNOTATIONS */}
                {isPdf && (
                  <div className="w-full h-[78vh] flex flex-col relative" ref={containerRef}>
                    {/* Annotation toolbar */}
                    <div className="bg-slate-900 text-white px-4 py-2 flex flex-wrap gap-2 items-center shrink-0 text-xs border-b border-slate-800 z-10 select-none">
                      <span className="font-semibold text-slate-450 mr-2">PDF Tool:</span>
                      <button 
                        onClick={() => setAnnotationMode(annotationMode === 'draw' ? null : 'draw')} 
                        className={`px-2.5 py-1 rounded font-bold transition flex items-center gap-1 ${annotationMode === 'draw' ? 'bg-amber-500 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
                      >
                        ✏️ Draw
                      </button>
                      <button 
                        onClick={() => setAnnotationMode(annotationMode === 'highlight' ? null : 'highlight')} 
                        className={`px-2.5 py-1 rounded font-bold transition flex items-center gap-1 ${annotationMode === 'highlight' ? 'bg-yellow-400 text-slate-950' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
                      >
                        🟨 Highlight
                      </button>
                      {annotations.length > 0 && (
                        <button 
                          onClick={() => setAnnotations([])} 
                          className="px-2.5 py-1 bg-red-650/15 text-red-400 hover:bg-red-650/20 rounded font-bold transition ml-auto"
                        >
                          Clear Markup
                        </button>
                      )}
                    </div>

                    {/* Main PDF iframe */}
                    <iframe
                      src={`https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`}
                      title={file.originalName}
                      className="w-full flex-1 border-0 bg-white"
                      onLoad={() => setPreviewLoading(false)}
                    />

                    {/* Drawing/Highlight Canvas Overlay */}
                    {annotationMode && (
                      <canvas
                        ref={canvasRef}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        className="absolute inset-x-0 bottom-0 z-20 cursor-crosshair"
                        style={{ top: '33px' }}
                        width={canvasWidth}
                        height={canvasHeight - 33}
                      />
                    )}
                  </div>
                )}

                {/* TEXT & CODE IN-BROWSER WORKSPACE EDITOR */}
                {isText && (
                  <div className="w-full h-[78vh] flex flex-col bg-slate-950 select-none">
                    {/* Editor Header Toolbar */}
                    <div className="bg-slate-900 border-b border-slate-800/80 px-4 py-2 flex items-center justify-between shrink-0">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setViewMode("preview")}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${viewMode === "preview" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"}`}
                        >
                          👁️ Preview
                        </button>
                        <button
                          onClick={() => setViewMode("editor")}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${viewMode === "editor" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"}`}
                        >
                          ✏️ Edit Code
                        </button>
                      </div>
                      {viewMode === "editor" && (
                        <button
                          onClick={handleSaveContent}
                          disabled={isSaving || editorContent === originalContent}
                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold rounded-lg text-xs transition flex items-center gap-1.5 shadow-sm"
                        >
                          {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                          Save Changes
                        </button>
                      )}
                    </div>

                    <div className="flex-1 overflow-auto relative">
                      {viewMode === "preview" ? (
                        activeFile.originalName?.endsWith('.md') || activeFile.originalName?.endsWith('.markdown') ? (
                          <div className="h-full overflow-y-auto bg-white dark:bg-[#0F172A] text-left">
                            {renderMarkdown(editorContent)}
                          </div>
                        ) : (
                          <iframe
                            src={url}
                            title={file.originalName}
                            className="w-full h-full bg-white border-0"
                            onLoad={() => setPreviewLoading(false)}
                          />
                        )
                      ) : (
                        <div className="flex h-full font-mono text-sm leading-relaxed text-slate-350 select-text text-left">
                          {/* Fake Line Numbers */}
                          <div className="px-3 py-4 text-slate-650 bg-slate-900 border-r border-slate-850 select-none text-right min-w-[3.5rem] leading-relaxed">
                            {Array.from({ length: editorContent.split('\n').length || 1 }).map((_, i) => (
                              <div key={i}>{i + 1}</div>
                            ))}
                          </div>
                          <textarea
                            value={editorContent}
                            onChange={(e) => setEditorContent(e.target.value)}
                            className="flex-1 p-4 bg-slate-950 text-slate-200 font-mono text-sm outline-none resize-none h-full border-0 select-text leading-relaxed font-normal whitespace-pre overflow-auto"
                            placeholder="Write your code or text here..."
                          />
                        </div>
                      )}
                    </div>
                  </div>
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
                    <p className="text-xl font-semibold text-gray-700 dark:text-[#94A3B8] mt-4">
                      Preview not available
                    </p>
                    <p className="text-gray-500 dark:text-[#94A3B8] mt-2">
                      This file type cannot be previewed directly.
                    </p>
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-6 inline-block px-6 py-3 bg-[#3B82F6] text-white rounded-xl hover:bg-[#2563EB] transition"
                    >
                      Open / Download File
                    </a>
                  </div>
                )}
              </>
            )}
          </div>
        </div>        {/* RIGHT COLUMN: DETAIL/COMMENTS/VERSIONS SIDE PANEL */}
        <div className={`w-full md:w-[380px] border-t md:border-t-0 md:border-l border-gray-200 dark:border-[#334155] bg-gray-50 dark:bg-[#0F172A]/40 flex flex-col shrink-0 min-h-0 ${
          activeMobileTab === "comments" ? "flex flex-1 min-h-[50vh] md:min-h-0 max-h-[80vh] md:max-h-[92vh]" : "hidden md:flex"
        }`}>
          {/* Panel Header with Tabs */}
          <div className="border-b border-gray-200 dark:border-[#334155] bg-white dark:bg-[#1E293B] flex flex-col shrink-0">
            <div className="px-6 pt-4 pb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveMobileTab("preview")}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#334155] rounded-lg transition md:hidden mr-1"
                  title="Back to Preview"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-[#94A3B8]" />
                </button>
                <span className="font-semibold text-gray-800 dark:text-gray-250">File Details</span>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#334155] rounded-lg transition"
                title="Close Modal"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-[#94A3B8]" />
              </button>
            </div>
            {/* Tabs */}
            <div className="flex px-4 border-t border-gray-100 dark:border-[#334155]/60">
              <button
                onClick={() => setActiveRightTab("comments")}
                className={`flex-1 py-2.5 text-xs font-semibold border-b-2 text-center transition outline-none ${
                  activeRightTab === "comments"
                    ? "border-emerald-500 text-emerald-600 dark:text-[#3B82F6]"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-[#F8FAFC]"
                }`}
              >
                Comments ({comments.length})
              </button>
              <button
                onClick={() => setActiveRightTab("versions")}
                className={`flex-1 py-2.5 text-xs font-semibold border-b-2 text-center transition outline-none ${
                  activeRightTab === "versions"
                    ? "border-emerald-500 text-emerald-600 dark:text-[#3B82F6]"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-[#F8FAFC]"
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
                    <div className="w-12 h-12 bg-gray-100 dark:bg-[#1E293B] rounded-full flex items-center justify-center mx-auto mb-3">
                      <MessageSquare className="w-6 h-6 text-gray-400 dark:text-[#94A3B8]" />
                    </div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-[#94A3B8]">No comments yet</h4>
                    <p className="text-xs text-gray-400 dark:text-[#94A3B8] mt-1">Start the conversation by typing below.</p>
                  </div>
                ) : (
                  comments.map((c) => {
                    const isMyComment = c.userId === user?.id;
                    const canDelete = isMyComment || activeFile.ownerId === user?.id;
                    return (
                      <div key={c.id} className="bg-white dark:bg-[#1E293B] p-3 rounded-xl border border-gray-100 dark:border-[#334155] shadow-xs group relative transition-colors duration-200">
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
                              <span className="text-[10px] text-gray-400 dark:text-[#94A3B8] shrink-0">
                                {formatCommentTime(c.createdAt)}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-[#94A3B8] mt-1 break-words leading-relaxed">
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
                  <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-[#94A3B8] italic bg-white dark:bg-[#1E293B] p-2.5 rounded-xl border border-dashed border-gray-200 dark:border-[#334155]">
                    <span className="font-medium text-emerald-600 dark:text-[#3B82F6] truncate max-w-[120px]">
                      {Object.values(typingUsers).join(", ")}
                    </span>
                    <span>{Object.keys(typingUsers).length > 1 ? "are" : "is"} typing...</span>
                    <div className="flex gap-1 items-center ml-1 shrink-0">
                      <span className="w-1.5 h-1.5 bg-[#3B82F6] rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1.5 h-1.5 bg-[#3B82F6] rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1.5 h-1.5 bg-[#3B82F6] rounded-full animate-bounce" />
                    </div>
                  </div>
                )}
                <div ref={commentsEndRef} />
              </div>

              {/* Comment Input Form */}
              <form onSubmit={handleCommentSubmit} className="p-4 border-t border-gray-200 dark:border-[#334155] bg-white dark:bg-[#1E293B] shrink-0">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={handleCommentChange}
                    placeholder="Add a comment..."
                    className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-955 text-xs border border-gray-200 dark:border-[#334155] rounded-lg text-gray-900 dark:text-[#F8FAFC] focus:ring-1 focus:ring-emerald-500 focus:bg-white dark:focus:bg-gray-900 focus:border-transparent outline-none transition"
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
              <div className="p-4 border-b border-gray-200/60 dark:border-[#334155] bg-white dark:bg-[#1E293B]/40 shrink-0 flex items-center justify-between">
                <span className="text-[11px] font-medium text-gray-500 dark:text-[#94A3B8] select-none">Keep track of edits & revisions</span>
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
                    <div className="w-12 h-12 bg-gray-100 dark:bg-[#1E293B] rounded-full flex items-center justify-center mx-auto mb-3">
                      <History className="w-6 h-6 text-gray-400 dark:text-[#94A3B8]" />
                    </div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-[#94A3B8]">No version history found</h4>
                    <p className="text-xs text-gray-450 dark:text-[#94A3B8] mt-1">Files uploaded with matching names will show revisions here.</p>
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
                            : "bg-white dark:bg-[#1E293B] border-gray-100 dark:border-[#334155]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-bold text-gray-800 dark:text-gray-250">
                                Version {v.versionNumber}
                              </span>
                              {isCurrent && (
                                <span className="bg-[#3B82F6] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0 select-none">
                                  Current
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-gray-450 dark:text-[#94A3B8] mt-1 select-none">
                              Uploaded {new Date(v.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <span className="text-xs font-semibold text-gray-550 dark:text-[#94A3B8] shrink-0 select-none">
                            {formatBytes(v.size)}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-end gap-1.5 mt-1 pt-2 border-t border-gray-100/50 dark:border-[#334155]/50">
                          <a
                            href={v.url}
                            target="_blank"
                            rel="noreferrer"
                            download
                            className="inline-flex h-7 px-2.5 items-center justify-center rounded-lg text-xs font-medium text-gray-600 hover:text-emerald-600 hover:bg-gray-100 dark:text-[#94A3B8] dark:hover:text-[#3B82F6] dark:hover:bg-[#334155] transition select-none"
                            title="Download this specific version"
                          >
                            <Download className="w-3.5 h-3.5 mr-1" />
                            Download
                          </a>

                          {!isCurrent && (isImage || isText) && (
                            <button
                              onClick={() => handleCompareClick(v)}
                              className="inline-flex h-7 px-2.5 items-center justify-center rounded-lg text-xs font-medium text-gray-600 hover:text-emerald-650 hover:bg-gray-100 dark:text-[#94A3B8] dark:hover:text-[#3B82F6] dark:hover:bg-gray-850 transition select-none"
                              title="Compare this version side-by-side with current version"
                            >
                              Compare
                            </button>
                          )}

                          {!isCurrent && (
                            <>
                              <button
                                onClick={() => handleRestoreVersion(v.id)}
                                disabled={uploadingVersion || restoringVersionId !== null || deletingVersionId !== null}
                                className="inline-flex h-7 px-2.5 items-center justify-center rounded-lg text-xs font-medium text-gray-600 hover:text-emerald-600 hover:bg-gray-100 dark:text-[#94A3B8] dark:hover:text-[#3B82F6] dark:hover:bg-[#334155] transition select-none disabled:opacity-40"
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
                                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-gray-450 hover:bg-red-50 hover:text-red-500 dark:text-[#94A3B8] dark:hover:bg-red-950/20 dark:hover:text-red-400 transition disabled:opacity-40"
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