import { useState, useEffect } from 'react';
import { useCrypto } from '../context/CryptoContext';
import { decryptFilesInWorker } from '../workers/cryptoWorkerClient';

export const useDecryptedFiles = (files) => {
  const { privateKey, isE2eeUnlocked } = useCrypto();
  const [workerDecrypted, setWorkerDecrypted] = useState(null);

  const hasEncrypted = files && files.length > 0 && files.some(f => f && (f.isEncrypted || f.encryptedKey));
  const shouldDecrypt = Boolean(hasEncrypted && isE2eeUnlocked && privateKey);

  useEffect(() => {
    if (!shouldDecrypt) return;

    let active = true;

    const decryptAll = async () => {
      try {
        const result = await decryptFilesInWorker(files, privateKey, isE2eeUnlocked);
        if (active) {
          setWorkerDecrypted(result);
        }
      } catch (err) {
        console.error("useDecryptedFiles error:", err);
      }
    };

    decryptAll();

    return () => {
      active = false;
    };
  }, [files, shouldDecrypt, isE2eeUnlocked, privateKey]);

  if (!shouldDecrypt) {
    return files || [];
  }

  return workerDecrypted || files || [];
};
