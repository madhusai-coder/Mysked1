import React, { useMemo, useState } from 'react';
import { Download, Edit3, FileText, Plus, Search, Trash2, Upload } from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { ConfirmDialog } from '../ConfirmDialog';
import type { Note, Subject } from '../../types';

interface NotesViewProps {
  notes: Note[];
  subjects: Subject[];
  onRefresh: () => Promise<void>;
}

export const NotesView: React.FC<NotesViewProps> = ({ notes, subjects, onRefresh }) => {
  const [search, setSearch] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const [attachmentDataUrl, setAttachmentDataUrl] = useState<string | null>(null);
  const [attachmentSize, setAttachmentSize] = useState<number | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Note | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        n.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }, [notes, search]);

  const openNew = () => {
    setEditing(null);
    setTitle('');
    setSubjectId(subjects[0]?.id || '');
    setContent('');
    setTagsInput('');
    setAttachmentName(null);
    setAttachmentDataUrl(null);
    setAttachmentSize(null);
    setFileError(null);
    setShowEditor(true);
  };

  const openEdit = (note: Note) => {
    setEditing(note);
    setTitle(note.title);
    setSubjectId(note.subjectId || '');
    setContent(note.content);
    setTagsInput(note.tags.join(', '));
    setAttachmentName(note.attachmentName);
    setAttachmentDataUrl(note.attachmentDataUrl);
    setAttachmentSize(note.attachmentSize);
    setFileError(null);
    setShowEditor(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setFileError('Only PDF attachments are supported.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setFileError('PDF attachment must be under 2 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setAttachmentName(file.name);
      setAttachmentSize(file.size);
      setAttachmentDataUrl(String(reader.result));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);
    const payload = {
      title,
      content,
      subjectId: subjectId || null,
      tags,
      attachmentName,
      attachmentDataUrl,
      attachmentSize,
    };
    if (editing) {
      await apiRequest(`/api/notes/${editing.id}`, { method: 'PUT', body: JSON.stringify(payload) });
    } else {
      await apiRequest('/api/notes', { method: 'POST', body: JSON.stringify(payload) });
    }
    setShowEditor(false);
    await onRefresh();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await apiRequest(`/api/notes/${deleteTarget.id}`, { method: 'DELETE' });
    setDeleteTarget(null);
    await onRefresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes, formulas, or tags..."
            className="w-full pl-9 pr-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10"
          />
        </div>
        <button
          type="button"
          onClick={openNew}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 text-white cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Note</span>
        </button>
      </div>

      {showEditor && (
        <form onSubmit={handleSave} className="glass-panel rounded-2xl p-6 space-y-4">
          <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
            {editing ? 'Edit Note' : 'Create Note & Attach Resource'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1">Note Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Dijkstra Shortest Path Proof"
                className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Subject</label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10"
              >
                <option value="">General</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.code} · {s.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Study Notes</label>
            <textarea
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write key definitions, equations, or revision points..."
              className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
            <div>
              <label className="block text-xs font-medium mb-1">Tags (comma separated)</label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="mid-sem, formulas, lab"
                className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">PDF Attachment (max 2 MB)</label>
              <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold glass-panel cursor-pointer">
                <Upload className="w-4 h-4 text-cyan-500" />
                <span>{attachmentName ? attachmentName : 'Upload PDF File'}</span>
                <input type="file" accept="application/pdf" onChange={handleFileChange} className="hidden" />
              </label>
            </div>
          </div>
          {fileError && <p className="text-xs text-red-500">{fileError}</p>}
          <div className="flex gap-3">
            <button type="submit" className="px-5 py-2 rounded-xl text-xs font-semibold bg-cyan-500 text-slate-950 cursor-pointer">
              {editing ? 'Update Note' : 'Save Note'}
            </button>
            <button type="button" onClick={() => setShowEditor(false)} className="px-4 py-2 rounded-xl text-xs font-semibold glass-panel cursor-pointer">
              Cancel
            </button>
          </div>
        </form>
      )}

      {filtered.length === 0 ? (
        <div className="glass-panel rounded-2xl p-10 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">No notes found.</p>
          <button type="button" onClick={openNew} className="mt-3 px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 cursor-pointer">
            Create First Note
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map((note) => {
            const sub = subjects.find((s) => s.id === note.subjectId);
            return (
              <div key={note.id} className="glass-panel rounded-2xl p-5 flex flex-col justify-between gap-4">
                <div>
                  <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400">
                    <span>{sub ? sub.code : 'GENERAL'} · {new Date(note.updatedAt).toLocaleDateString()}</span>
                    <div className="flex items-center gap-1.5">
                      <button type="button" onClick={() => openEdit(note)} className="p-1 text-slate-400 hover:text-blue-400 cursor-pointer" aria-label="Edit note">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={() => setDeleteTarget(note)} className="p-1 text-slate-400 hover:text-red-400 cursor-pointer" aria-label="Delete note">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <h4 className="font-display font-bold text-base text-slate-900 dark:text-white mt-1">{note.title}</h4>
                  <pre className="mt-2 text-xs font-sans text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {note.content}
                  </pre>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-white/10 text-xs">
                  <span className="font-mono text-slate-500 dark:text-slate-400">
                    {note.tags.length > 0 ? note.tags.map((t) => `#${t}`).join(' ') : 'No tags'}
                  </span>
                  {note.attachmentName && note.attachmentDataUrl && (
                    <a
                      href={note.attachmentDataUrl}
                      download={note.attachmentName}
                      className="inline-flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400 font-semibold hover:underline"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>{note.attachmentName}</span>
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Note"
        message={`Delete "${deleteTarget?.title}"?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
