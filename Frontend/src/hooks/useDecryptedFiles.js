import { useState, useEffect } from 'react';
import { useCrypto } from '../context/CryptoContext';
import { decryptFilesInWorker } from '../workers/cryptoWorkerClient';

export const useDecryptedFiles = (files) => {
  const { privateKey, isE2eeUnlocked } = useCrypto();
  const [decryptedFiles, setDecryptedFiles] = useState([]);

  useEffect(() => {
    let active = true;

    const decryptAll = async () => {
      if (!files || files.length === 0) {
        if (active) setDecryptedFiles([]);
        return;
      }

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
  }, [files, isE2eeUnlocked, privateKey]);

  return decryptedFiles;
};
