import { useState, useEffect, useRef } from 'react';
import { useCrypto } from '../context/CryptoContext';
import { decryptFilesInWorker } from '../workers/cryptoWorkerClient';

export const useDecryptedFiles = (files) => {
  const { privateKey, isE2eeUnlocked } = useCrypto();
  const [decryptedFiles, setDecryptedFiles] = useState(() => files || []);

  const hasEncrypted = files && files.length > 0 && files.some(f => f && (f.isEncrypted || f.encryptedKey));

  useEffect(() => {
    if (!files || files.length === 0) {
      setDecryptedFiles([]);
      return;
    }

    // Fast path: if no files are encrypted or E2EE is locked, return immediately without worker serialization
    if (!hasEncrypted || !isE2eeUnlocked || !privateKey) {
      setDecryptedFiles(files);
      return;
    }

    let active = true;

    const decryptAll = async () => {
      try {
        const result = await decryptFilesInWorker(files, privateKey, isE2eeUnlocked);
        if (active) {
          setDecryptedFiles(result);
        }
      } catch (err) {
        console.error("useDecryptedFiles error:", err);
        if (active) {
          setDecryptedFiles(files);
        }
      }
    };

    decryptAll();

    return () => {
      active = false;
    };
  }, [files, hasEncrypted, isE2eeUnlocked, privateKey]);

  return hasEncrypted && isE2eeUnlocked ? decryptedFiles : (files || []);
};

