/**
 * Web Worker for DataStock Zero-Knowledge End-to-End Encryption (E2EE)
 * Offloads RSA-OAEP and AES-GCM cryptographic operations from the main UI thread.
 */

// ── UTILITIES ──

const base64ToBuffer = (base64) => {
  const binary = self.atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

const bufferToBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return self.btoa(binary);
};

// Cached CryptoKey objects
let cachedPrivateKeyJwk = null;
let cachedPrivateKey = null;

// Cache of decrypted symmetric keys keyed by encryptedKey base64
const symmetricKeyCache = new Map();

/**
 * Imports RSA private key from JWK, caching the CryptoKey instance.
 */
const getOrImportRsaPrivateKey = async (jwkString) => {
  if (cachedPrivateKey && cachedPrivateKeyJwk === jwkString) {
    return cachedPrivateKey;
  }
  try {
    const jwk = JSON.parse(jwkString);
    const key = await self.crypto.subtle.importKey(
      "jwk",
      jwk,
      { name: "RSA-OAEP", hash: "SHA-256" },
      false,
      ["decrypt"]
    );
    cachedPrivateKeyJwk = jwkString;
    cachedPrivateKey = key;
    return key;
  } catch (err) {
    console.error("[CryptoWorker] Failed to import RSA private key:", err);
    throw err;
  }
};

/**
 * Decrypts AES-256 symmetric key using RSA private key
 */
const decryptSymmetricKeyWithRsa = async (encryptedKeyBase64, rsaPrivateKey) => {
  if (symmetricKeyCache.has(encryptedKeyBase64)) {
    return symmetricKeyCache.get(encryptedKeyBase64);
  }

  const encryptedData = base64ToBuffer(encryptedKeyBase64);
  const decryptedRaw = await self.crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    rsaPrivateKey,
    encryptedData
  );

  const aesKey = await self.crypto.subtle.importKey(
    "raw",
    decryptedRaw,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );

  // Keep cache size bounded
  if (symmetricKeyCache.size > 2000) {
    const firstKey = symmetricKeyCache.keys().next().value;
    symmetricKeyCache.delete(firstKey);
  }
  symmetricKeyCache.set(encryptedKeyBase64, aesKey);

  return aesKey;
};

/**
 * Decrypts AES-GCM ciphertext buffer to string
 */
const decryptStringWithAes = async (ciphertextBase64, aesKey, ivBase64) => {
  const iv = base64ToBuffer(ivBase64);
  const ciphertext = base64ToBuffer(ciphertextBase64);
  const decrypted = await self.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv },
    aesKey,
    ciphertext
  );
  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
};

// ── MESSAGE DISPATCHER ──

self.onmessage = async (e) => {
  const { type, id, payload } = e.data || {};

  if (!type) return;

  try {
    switch (type) {
      case "PING": {
        self.postMessage({ type: "PONG", id, success: true });
        break;
      }

      case "CLEAR_KEYS": {
        cachedPrivateKeyJwk = null;
        cachedPrivateKey = null;
        symmetricKeyCache.clear();
        self.postMessage({ type: "CLEAR_KEYS_SUCCESS", id, success: true });
        break;
      }

      case "DECRYPT_FILES_BATCH": {
        const { files, privateKeyJwk } = payload;
        if (!files || !Array.isArray(files)) {
          self.postMessage({ type: "DECRYPT_FILES_BATCH_SUCCESS", id, success: true, results: [] });
          return;
        }

        let rsaKey = null;
        if (privateKeyJwk) {
          try {
            rsaKey = await getOrImportRsaPrivateKey(privateKeyJwk);
          } catch (err) {
            console.error("[CryptoWorker] Key import failed:", err);
          }
        }

        // Process files in parallel batches
        const results = await Promise.all(
          files.map(async (file) => {
            if (!file) return file;

            const isEnc = file.isEncrypted ?? file.file?.isEncrypted ?? false;
            const encKey = file.encryptedKey ?? file.file?.encryptedKey ?? null;
            const nameIv = file.nameIv ?? file.file?.nameIv ?? null;
            const originalName = file.originalName ?? file.file?.originalName ?? '';

            if (!isEnc) {
              return { id: file.id, originalName, isLocked: false };
            }

            if (!rsaKey || !encKey || !nameIv) {
              const fallbackName = originalName.startsWith('🔒')
                ? originalName
                : `🔒 e2ee_${originalName.slice(0, 8)}...`;
              return { id: file.id, originalName: fallbackName, isLocked: true };
            }

            try {
              const aesKey = await decryptSymmetricKeyWithRsa(encKey, rsaKey);
              const decryptedName = await decryptStringWithAes(originalName, aesKey, nameIv);
              return { id: file.id, originalName: decryptedName, isLocked: false };
            } catch (decErr) {
              const fallbackName = originalName.startsWith('🔒')
                ? originalName
                : `🔒 e2ee_${originalName.slice(0, 8)}...`;
              return { id: file.id, originalName: fallbackName, isLocked: true };
            }
          })
        );

        self.postMessage({
          type: "DECRYPT_FILES_BATCH_SUCCESS",
          id,
          success: true,
          results
        });
        break;
      }

      case "DECRYPT_BUFFER": {
        const { ciphertextBuffer, encryptedKeyBase64, ivBase64, privateKeyJwk } = payload;
        const rsaKey = await getOrImportRsaPrivateKey(privateKeyJwk);
        const aesKey = await decryptSymmetricKeyWithRsa(encryptedKeyBase64, rsaKey);
        const iv = base64ToBuffer(ivBase64);
        const decrypted = await self.crypto.subtle.decrypt(
          { name: "AES-GCM", iv },
          aesKey,
          ciphertextBuffer
        );
        self.postMessage(
          { type: "DECRYPT_BUFFER_SUCCESS", id, success: true, decryptedBuffer: decrypted },
          [decrypted] // Transfer buffer
        );
        break;
      }

      default:
        self.postMessage({ type: "ERROR", id, error: `Unknown action: ${type}` });
    }
  } catch (err) {
    self.postMessage({
      type: "ERROR",
      id,
      error: err.message || "Crypto worker internal error"
    });
  }
};
