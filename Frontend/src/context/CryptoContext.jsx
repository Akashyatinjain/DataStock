import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchProfile } from '../store/slices/authSlice';
import { authFetch, apiUrl } from '../utils/auth';
import {
  deriveKeyFromPassphrase,
  generateSymmetricKey,
  generateRsaKeyPair,
  exportKeyToJwk,
  importSymmetricKeyFromJwk,
  importRsaPrivateKeyFromJwk,
  encryptBuffer,
  decryptBuffer,
  bufferToBase64,
  base64ToBuffer,
} from '../utils/cryptoHelper';

const CryptoContext = createContext(null);

export const CryptoProvider = ({ children }) => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  
  const [masterKey, setMasterKey] = useState(null);
  const [privateKey, setPrivateKey] = useState(null);
  const [isE2eeUnlocked, setIsE2eeUnlocked] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Derived setup state
  const isE2eeSetup = !!(user?.encryptedMasterKey && user?.encryptionSalt);

  // Lock E2EE automatically when user logs out
  useEffect(() => {
    if (!user) {
      setMasterKey(null);
      setPrivateKey(null);
      setIsE2eeUnlocked(false);
    }
  }, [user]);

  const setupE2ee = async (passphrase) => {
    setLoading(true);
    setError(null);
    try {
      // 1. Generate E2EE symmetric master key
      const newMasterKey = await generateSymmetricKey();
      const masterKeyJwk = await exportKeyToJwk(newMasterKey);
      
      // 2. Generate E2EE RSA keypair for file sharing
      const newRsaKeyPair = await generateRsaKeyPair();
      const publicKeyJwk = await exportKeyToJwk(newRsaKeyPair.publicKey);
      const privateKeyJwk = await exportKeyToJwk(newRsaKeyPair.privateKey);
      
      // 3. Generate salt & derive passphrase key
      const saltBytes = window.crypto.getRandomValues(new Uint8Array(16));
      const saltBase64 = bufferToBase64(saltBytes);
      const derivedPassKey = await deriveKeyFromPassphrase(passphrase, saltBase64);
      
      // 4. Encrypt master key & private RSA key with derived passphrase key
      const encoder = new TextEncoder();
      const masterKeyJwkBuffer = encoder.encode(masterKeyJwk);
      const privateKeyJwkBuffer = encoder.encode(privateKeyJwk);
      
      const encMaster = await encryptBuffer(masterKeyJwkBuffer, derivedPassKey);
      const encPrivate = await encryptBuffer(privateKeyJwkBuffer, derivedPassKey);
      
      // 5. Send encrypted keys to the backend
      const response = await authFetch(apiUrl('/user/setup-e2ee'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          encryptionSalt: saltBase64,
          encryptedMasterKey: bufferToBase64(encMaster.ciphertext),
          masterKeyIv: encMaster.iv,
          publicKey: publicKeyJwk,
          encryptedPrivateKey: bufferToBase64(encPrivate.ciphertext),
          privateKeyIv: encPrivate.iv,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to save E2EE keys on server');
      }

      // 6. Store decrypted keys in memory
      setMasterKey(newMasterKey);
      setPrivateKey(newRsaKeyPair.privateKey);
      setIsE2eeUnlocked(true);
      
      // 7. Refresh Redux user profile
      dispatch(fetchProfile());
      return true;
    } catch (err) {
      console.error('E2EE Setup Error:', err);
      setError(err.message || 'Failed to set up E2EE keys');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const unlockE2ee = async (passphrase) => {
    if (!isE2eeSetup) {
      throw new Error('E2EE is not set up yet.');
    }
    setLoading(true);
    setError(null);
    try {
      const {
        encryptionSalt,
        encryptedMasterKey,
        masterKeyIv,
        encryptedPrivateKey,
        privateKeyIv,
      } = user;

      // 1. Derive passphrase key from passphrase and salt
      const derivedPassKey = await deriveKeyFromPassphrase(passphrase, encryptionSalt);

      // 2. Decrypt E2EE master key
      const encMasterKeyBuffer = base64ToBuffer(encryptedMasterKey);
      const decMasterJwkBuffer = await decryptBuffer(encMasterKeyBuffer, derivedPassKey, masterKeyIv);
      const decoder = new TextDecoder();
      const masterKeyJwk = decoder.decode(decMasterJwkBuffer);
      const decMasterKey = await importSymmetricKeyFromJwk(masterKeyJwk);

      // 3. Decrypt RSA private key
      const encPrivateKeyBuffer = base64ToBuffer(encryptedPrivateKey);
      const decPrivateJwkBuffer = await decryptBuffer(encPrivateKeyBuffer, derivedPassKey, privateKeyIv);
      const privateKeyJwk = decoder.decode(decPrivateJwkBuffer);
      const decPrivateKey = await importRsaPrivateKeyFromJwk(privateKeyJwk);

      // 4. Save to state
      setMasterKey(decMasterKey);
      setPrivateKey(decPrivateKey);
      setIsE2eeUnlocked(true);
      return true;
    } catch (err) {
      console.error('E2EE Unlock Error:', err);
      setError('Invalid passphrase. Decryption failed.');
      throw new Error('Invalid passphrase. Decryption failed.');
    } finally {
      setLoading(false);
    }
  };

  const lockE2ee = () => {
    setMasterKey(null);
    setPrivateKey(null);
    setIsE2eeUnlocked(false);
    setError(null);
  };

  return (
    <CryptoContext.Provider
      value={{
        isE2eeSetup,
        isE2eeUnlocked,
        masterKey,
        privateKey,
        setupE2ee,
        unlockE2ee,
        lockE2ee,
        loading,
        error,
      }}
    >
      {children}
    </CryptoContext.Provider>
  );
};

export const useCrypto = () => {
  const context = useContext(CryptoContext);
  if (!context) {
    throw new Error('useCrypto must be used within a CryptoProvider');
  }
  return context;
};
