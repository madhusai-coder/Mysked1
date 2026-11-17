import React from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
      <div className="glass-panel rounded-2xl w-full max-w-sm p-6">
        <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">{title}</h3>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">{message}</p>
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-xs font-semibold glass-panel text-slate-700 dark:text-slate-200 hover:border-slate-400 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 text-white hover:bg-red-500 cursor-pointer"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
