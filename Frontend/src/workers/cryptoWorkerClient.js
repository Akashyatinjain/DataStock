/**
 * CryptoWorkerClient: Singleton client orchestrating Web Worker communication
 * with high-performance LRU caching and transparent main-thread fallback.
 */

import {
  decryptSymmetricKeyWithRsa,
  decryptString,
  exportKeyToJwk
} from '../utils/cryptoHelper';

// Fast in-memory cache for decrypted filenames: (fileId + encryptedKey + nameIv) -> decryptedName
const filenameDecryptionCache = new Map();
const MAX_CACHE_ITEMS = 5000;

let workerInstance = null;
let pendingRequests = new Map();
let requestIdCounter = 0;
let cachedPrivateKeyJwk = null;
let cachedPrivateKeyRef = null;

/**
 * Initializes or returns the singleton Web Worker
 */
const getWorker = () => {
  if (typeof window === 'undefined' || typeof Worker === 'undefined') {
    return null;
  }

  if (!workerInstance) {
    try {
      workerInstance = new Worker(
        new URL('./cryptoWorker.js', import.meta.url),
        { type: 'module' }
      );

      workerInstance.onmessage = (e) => {
        const { type, id, success, results, error } = e.data || {};
        if (!id || !pendingRequests.has(id)) return;

        const { resolve, reject } = pendingRequests.get(id);
        pendingRequests.delete(id);

        if (success) {
          resolve(results);
        } else {
          reject(new Error(error || 'Crypto worker operation failed'));
        }
      };

      workerInstance.onerror = (err) => {
        console.warn('[CryptoWorkerClient] Worker error, will use main thread fallback:', err);
        // Terminate faulted worker so next request can recreate or fallback
        try {
          workerInstance.terminate();
        } catch (_) {}
        workerInstance = null;

        // Reject all pending
        pendingRequests.forEach(({ reject }) => {
          reject(new Error('Worker crashed'));
        });
        pendingRequests.clear();
      };
    } catch (err) {
      console.warn('[CryptoWorkerClient] Failed to instantiate worker:', err);
      workerInstance = null;
    }
  }

  return workerInstance;
};

/**
 * Clears worker cache and in-memory caches
 */
export const clearCryptoWorker = () => {
  filenameDecryptionCache.clear();
  cachedPrivateKeyJwk = null;
  cachedPrivateKeyRef = null;

  if (workerInstance) {
    try {
      workerInstance.postMessage({ type: 'CLEAR_KEYS', id: ++requestIdCounter });
    } catch (_) {}
  }
};

/**
 * Main-thread fallback decryption
 */
const decryptFilesOnMainThread = async (files, privateKey) => {
  return await Promise.all(
    files.map(async (file) => {
      if (!file) return file;
      const isEnc = file.isEncrypted ?? file.file?.isEncrypted ?? false;
      const encKey = file.encryptedKey ?? file.file?.encryptedKey ?? null;
      const nameIv = file.nameIv ?? file.file?.nameIv ?? null;
      const originalName = file.originalName ?? file.file?.originalName ?? '';

      if (!isEnc) {
        return { id: file.id, originalName, isLocked: false };
      }

      if (!privateKey || !encKey || !nameIv) {
        const fallbackName = originalName.startsWith('🔒')
          ? originalName
          : `🔒 e2ee_${originalName.slice(0, 8)}...`;
        return { id: file.id, originalName: fallbackName, isLocked: true };
      }

      try {
        const fileKey = await decryptSymmetricKeyWithRsa(encKey, privateKey);
        const decryptedName = await decryptString(originalName, fileKey, nameIv);
        return { id: file.id, originalName: decryptedName, isLocked: false };
      } catch (err) {
        const fallbackName = originalName.startsWith('🔒')
          ? originalName
          : `🔒 e2ee_${originalName.slice(0, 8)}...`;
        return { id: file.id, originalName: fallbackName, isLocked: true };
      }
    })
  );
};

/**
 * High-performance batch file decryption with Web Worker and memory caching
 */
export const decryptFilesInWorker = async (files, privateKey, isE2eeUnlocked) => {
  if (!files || files.length === 0) return [];

  // If vault is locked or no privateKey, return locked representations directly
  if (!isE2eeUnlocked || !privateKey) {
    return files.map((file) => {
      if (!file) return file;
      const isEnc = file.isEncrypted ?? file.file?.isEncrypted ?? false;
      const originalName = file.originalName ?? file.file?.originalName ?? '';

      if (isEnc) {
        const lockedName = originalName.startsWith('🔒')
          ? originalName
          : `🔒 e2ee_${originalName.slice(0, 8)}...`;
        if (file.file) {
          return {
            ...file,
            file: { ...file.file, originalName: lockedName },
            originalName: lockedName,
            isLocked: true,
          };
        }
        return { ...file, originalName: lockedName, isLocked: true };
      }
      return { ...file, isLocked: false };
    });
  }

  // Check cache for already decrypted filenames
  const filesNeedingDecryption = [];
  const resultMap = new Map();

  for (const file of files) {
    if (!file) continue;
    const isEnc = file.isEncrypted ?? file.file?.isEncrypted ?? false;
    const encKey = file.encryptedKey ?? file.file?.encryptedKey ?? '';
    const nameIv = file.nameIv ?? file.file?.nameIv ?? '';
    const originalName = file.originalName ?? file.file?.originalName ?? '';

    if (!isEnc) {
      resultMap.set(file.id, { originalName, isLocked: false });
      continue;
    }

    const cacheKey = `${file.id || ''}_${encKey}_${nameIv}_${originalName}`;
    if (filenameDecryptionCache.has(cacheKey)) {
      resultMap.set(file.id, filenameDecryptionCache.get(cacheKey));
    } else {
      filesNeedingDecryption.push(file);
    }
  }

  // If all files were cached, assemble and return immediately!
  if (filesNeedingDecryption.length === 0) {
    return files.map((file) => {
      if (!file) return file;
      const cached = resultMap.get(file.id);
      if (cached) {
        if (file.file) {
          return {
            ...file,
            file: { ...file.file, originalName: cached.originalName },
            originalName: cached.originalName,
            isLocked: cached.isLocked,
          };
        }
        return {
          ...file,
          originalName: cached.originalName,
          isLocked: cached.isLocked,
        };
      }
      return file;
    });
  }

  // Cache/export RSA private key to JWK once
  if (privateKey !== cachedPrivateKeyRef) {
    try {
      cachedPrivateKeyJwk = await exportKeyToJwk(privateKey);
      cachedPrivateKeyRef = privateKey;
    } catch (err) {
      console.warn('[CryptoWorkerClient] Failed to export JWK, will use main thread:', err);
      cachedPrivateKeyJwk = null;
    }
  }

  const worker = getWorker();
  let decryptedResults = null;

  if (worker && cachedPrivateKeyJwk) {
    try {
      const reqId = ++requestIdCounter;
      const workerPromise = new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          pendingRequests.delete(reqId);
          reject(new Error('Worker decryption timeout'));
        }, 15000);

        pendingRequests.set(reqId, {
          resolve: (res) => {
            clearTimeout(timeout);
            resolve(res);
          },
          reject: (err) => {
            clearTimeout(timeout);
            reject(err);
          },
        });
      });

      worker.postMessage({
        type: 'DECRYPT_FILES_BATCH',
        id: reqId,
        payload: {
          files: filesNeedingDecryption.map((f) => ({
            id: f.id,
            originalName: f.originalName ?? f.file?.originalName,
            isEncrypted: f.isEncrypted ?? f.file?.isEncrypted,
            encryptedKey: f.encryptedKey ?? f.file?.encryptedKey,
            nameIv: f.nameIv ?? f.file?.nameIv,
          })),
          privateKeyJwk: cachedPrivateKeyJwk,
        },
      });

      decryptedResults = await workerPromise;
    } catch (workerErr) {
      console.warn('[CryptoWorkerClient] Worker execution failed, falling back to main thread:', workerErr);
      decryptedResults = await decryptFilesOnMainThread(filesNeedingDecryption, privateKey);
    }
  } else {
    // Fallback to main thread
    decryptedResults = await decryptFilesOnMainThread(filesNeedingDecryption, privateKey);
  }

  // Update in-memory cache
  if (Array.isArray(decryptedResults)) {
    for (const item of decryptedResults) {
      if (!item) continue;
      const sourceFile = filesNeedingDecryption.find((f) => f.id === item.id);
      if (sourceFile) {
        const encKey = sourceFile.encryptedKey ?? sourceFile.file?.encryptedKey ?? '';
        const nameIv = sourceFile.nameIv ?? sourceFile.file?.nameIv ?? '';
        const origName = sourceFile.originalName ?? sourceFile.file?.originalName ?? '';
        const cacheKey = `${sourceFile.id || ''}_${encKey}_${nameIv}_${origName}`;

        if (!item.isLocked) {
          if (filenameDecryptionCache.size > MAX_CACHE_ITEMS) {
            const firstKey = filenameDecryptionCache.keys().next().value;
            filenameDecryptionCache.delete(firstKey);
          }
          filenameDecryptionCache.set(cacheKey, {
            originalName: item.originalName,
            isLocked: item.isLocked,
          });
        }
      }
      resultMap.set(item.id, item);
    }
  }

  // Construct final result array maintaining exact reference structure
  return files.map((file) => {
    if (!file) return file;
    const res = resultMap.get(file.id);
    if (res) {
      if (file.file) {
        return {
          ...file,
          file: { ...file.file, originalName: res.originalName },
          originalName: res.originalName,
          isLocked: res.isLocked,
        };
      }
      return {
        ...file,
        originalName: res.originalName,
        isLocked: res.isLocked,
      };
    }
    return file;
  });
};
