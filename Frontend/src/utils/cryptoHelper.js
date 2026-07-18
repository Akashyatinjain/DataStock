/**
 * Frontend cryptographic utilities using the browser Web Crypto API.
 */

// ── CONVERSIONS ──

export const bufferToBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

export const base64ToBuffer = (base64) => {
  const binary = window.atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

// ── SYMMETRIC AES-GCM KEYS ──

export const generateSymmetricKey = async () => {
  return await window.crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"]
  );
};

export const deriveKeyFromPassphrase = async (passphrase, saltBase64) => {
  const encoder = new TextEncoder();
  const salt = base64ToBuffer(saltBase64);
  
  const baseKey = await window.crypto.subtle.importKey(
    "raw",
    encoder.encode(passphrase),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );
  
  return await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
};

// ── ASYMMETRIC RSA KEYS ──

export const generateRsaKeyPair = async () => {
  return await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );
};

// ── EXPORT / IMPORT ──

export const exportKeyToJwk = async (key) => {
  const jwk = await window.crypto.subtle.exportKey("jwk", key);
  return JSON.stringify(jwk);
};

export const importSymmetricKeyFromJwk = async (jwkString) => {
  const jwk = JSON.parse(jwkString);
  return await window.crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
};

export const importRsaPublicKeyFromJwk = async (jwkString) => {
  const jwk = JSON.parse(jwkString);
  return await window.crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["encrypt"]
  );
};

export const importRsaPrivateKeyFromJwk = async (jwkString) => {
  const jwk = JSON.parse(jwkString);
  return await window.crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["decrypt"]
  );
};

// ── ENCRYPT / DECRYPT SYMMETRIC (AES-GCM) ──

export const encryptBuffer = async (arrayBuffer, key) => {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    arrayBuffer
  );
  
  return {
    ciphertext: encrypted,
    iv: bufferToBase64(iv),
  };
};

export const decryptBuffer = async (ciphertextBuffer, key, ivBase64) => {
  const iv = base64ToBuffer(ivBase64);
  return await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    ciphertextBuffer
  );
};

// ── STRING ENCRYPTION (FOR FILENAMES) ──

export const encryptString = async (text, key) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const { ciphertext, iv } = await encryptBuffer(data, key);
  return {
    ciphertext: bufferToBase64(ciphertext),
    iv,
  };
};

export const decryptString = async (ciphertextBase64, key, ivBase64) => {
  const ciphertext = base64ToBuffer(ciphertextBase64);
  const decrypted = await decryptBuffer(ciphertext, key, ivBase64);
  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
};

// ── ASYMMETRIC ENCRYPT / DECRYPT (RSA-OAEP) ──

export const encryptSymmetricKeyWithRsa = async (symmetricKey, rsaPublicKey) => {
  // Export symmetric key raw bytes
  const rawKey = await window.crypto.subtle.exportKey("raw", symmetricKey);
  const encrypted = await window.crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    rsaPublicKey,
    rawKey
  );
  return bufferToBase64(encrypted);
};

export const decryptSymmetricKeyWithRsa = async (encryptedKeyBase64, rsaPrivateKey) => {
  const encryptedData = base64ToBuffer(encryptedKeyBase64);
  const decryptedRaw = await window.crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    rsaPrivateKey,
    encryptedData
  );
  // Import the raw bytes back as a SubtleCrypto key
  return await window.crypto.subtle.importKey(
    "raw",
    decryptedRaw,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
};
