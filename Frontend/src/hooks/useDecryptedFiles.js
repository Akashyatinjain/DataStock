import { useState, useEffect } from 'react';
import { useCrypto } from '../context/CryptoContext';
import { decryptSymmetricKeyWithRsa, decryptString } from '../utils/cryptoHelper';

export const useDecryptedFiles = (files) => {
  const { privateKey, isE2eeUnlocked } = useCrypto();
  const [decryptedFiles, setDecryptedFiles] = useState([]);

  useEffect(() => {
    let active = true;

    const decryptAll = async () => {
      if (!files || files.length === 0) {
        setDecryptedFiles([]);
        return;
      }

      const result = await Promise.all(
        files.map(async (file) => {
          if (!file) return file;
          // Support both shared share.file schema and standard file schema
          const isEnc = file.isEncrypted ?? file.file?.isEncrypted ?? false;
          const encKey = file.encryptedKey ?? file.file?.encryptedKey ?? null;
          const nameIv = file.nameIv ?? file.file?.nameIv ?? null;
          const originalName = file.originalName ?? file.file?.originalName ?? '';

          if (isEnc) {
            if (isE2eeUnlocked && privateKey && encKey && nameIv) {
              try {
                // Decrypt key using RSA private key
                const fileKey = await decryptSymmetricKeyWithRsa(encKey, privateKey);
                // Decrypt string name
                const decryptedName = await decryptString(originalName, fileKey, nameIv);
                
                if (file.file) {
                  return {
                    ...file,
                    file: { ...file.file, originalName: decryptedName },
                    originalName: decryptedName,
                    isLocked: false,
                  };
                }
                return { ...file, originalName: decryptedName, isLocked: false };
              } catch (e) {
                console.error("Failed to decrypt file name:", e);
                return { ...file, originalName: `🔒 Encrypted File (Locked)`, isLocked: true };
              }
            } else {
              return { ...file, originalName: `🔒 Encrypted File (Locked)`, isLocked: true };
            }
          }
          return { ...file, isLocked: false };
        })
      );

      if (active) {
        setDecryptedFiles(result);
      }
    };

    decryptAll();

    return () => {
      active = false;
    };
  }, [files, isE2eeUnlocked, privateKey]);

  return decryptedFiles;
};
