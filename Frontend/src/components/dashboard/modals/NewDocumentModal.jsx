import React, { useState } from 'react';
import {
  X,
  FileText,
  Sparkles,
  CheckSquare,
  FileCode,
  Layers,
  Loader2,
} from 'lucide-react';
import { apiUrl, authFetch } from '../../../utils/auth';

const TEMPLATES = [
  {
    id: 'blank',
    name: 'Blank Document',
    description: 'Clean slate for notes, drafts, or code',
    icon: FileText,
    color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800',
    content: `# Untitled Document\n\nStart typing your content here...\n`,
  },
  {
    id: 'meeting',
    name: 'Meeting Notes',
    description: 'Attendees, agenda, discussion, and action items',
    icon: Layers,
    color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800',
    content: `# 📋 Team Sync & Meeting Notes\n**Date:** ${new Date().toLocaleDateString()}\n**Participants:** @you, @team\n\n## 🎯 Goals & Agenda\n1. Review sprint progress\n2. Blockers and architectural decisions\n3. Roadmap for next release\n\n## 💬 Discussion & Notes\n- \n\n## ✅ Action Items\n- [ ] Finalize collaborative workspace design\n- [ ] Run benchmark load tests\n- [ ] Update documentation\n`,
  },
  {
    id: 'spec',
    name: 'Project Specification',
    description: 'Product requirements, architecture, and milestones',
    icon: FileCode,
    color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
    content: `# 🚀 Product Specification\n**Author:** Current User\n**Status:** In Review\n\n## 1. Overview & Problem Statement\nDescribe the user problem and the value proposition.\n\n## 2. Technical Architecture\n- **Frontend:** React 19, Tailwind CSS, WebSockets\n- **Backend:** Node.js, Express, Socket.io, Prisma\n- **Database:** PostgreSQL\n\n## 3. Milestones & Checklist\n- [ ] Phase 1: MVP Core Logic\n- [ ] Phase 2: Real-time Multi-user Sync\n- [ ] Phase 3: Production Hardening\n`,
  },
  {
    id: 'tasks',
    name: 'Task Checklist',
    description: 'Linear-style interactive priority task board',
    icon: CheckSquare,
    color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
    content: `# ⚡ Priority Task Board\n\n## 🔴 High Priority\n- [ ] Implement live multiplayer cursors\n- [ ] Verify debounced auto-save\n\n## 🟡 In Progress\n- [ ] Style Linear-tier formatting toolbar\n- [ ] Add version time machine diff viewer\n\n## 🟢 Completed\n- [x] Socket.io collaboration rooms\n- [x] Template scaffold generator\n`,
  },
];

export default function NewDocumentModal({
  isOpen,
  onClose,
  folderId = null,
  onCreated,
  toast,
}) {
  const [title, setTitle] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('blank');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const docTitle = title.trim() || 'Untitled Document';
    const chosenTemplate = TEMPLATES.find((t) => t.id === selectedTemplate) || TEMPLATES[0];

    setIsSubmitting(true);
    try {
      const res = await authFetch(apiUrl('/files/create-document'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: docTitle.endsWith('.md') || docTitle.endsWith('.txt') ? docTitle : `${docTitle}.md`,
          folderId: folderId || null,
          content: chosenTemplate.content,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast?.success?.(`Document "${data.file.originalName}" created!`);
        onCreated?.(data.file);
        onClose();
      } else {
        toast?.error?.(data.message || 'Failed to create document');
      }
    } catch (err) {
      console.error('Create document error:', err);
      toast?.error?.('Network error while creating document');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-750">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                New Collaborative Document
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Google Docs & Linear tier live collaboration
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Document Name
            </label>
            <input
              type="text"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Sprint Planning, System Spec, Meeting Notes"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Choose a Starter Template
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {TEMPLATES.map((tmpl) => {
                const Icon = tmpl.icon;
                const isSelected = selectedTemplate === tmpl.id;
                return (
                  <button
                    type="button"
                    key={tmpl.id}
                    onClick={() => setSelectedTemplate(tmpl.id)}
                    className={`flex items-start gap-3 p-3 rounded-xl border text-left transition cursor-pointer ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${tmpl.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {tmpl.name}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                        {tmpl.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:scale-98 shadow-md shadow-indigo-500/25 transition disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Create & Open Workspace
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
