import React from 'react';
import { Lock } from 'lucide-react';

export default function SecurityBadge({ isEncrypted, isLocked }) {
  if (!isEncrypted) return null;

  return (
    <span
      className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${
        isLocked
          ? 'text-amber-800 bg-amber-50 border-amber-200/70 dark:text-amber-300 dark:bg-amber-950/40 dark:border-amber-900/40'
          : 'text-[#2563EB] bg-blue-50 border-blue-150 dark:text-blue-400 dark:bg-blue-950/30 dark:border-blue-900/40'
      }`}
      title={
        isLocked
          ? 'End-to-End Encrypted (AES-256). Vault is currently locked; unlock with passphrase to decrypt.'
          : 'End-to-End Encrypted (AES-256 GCM). Zero-knowledge encrypted; vault is unlocked.'
      }
    >
      <Lock className="w-2.5 h-2.5" />
      {isLocked ? 'E2EE · Locked' : 'E2EE'}
    </span>
  );
}