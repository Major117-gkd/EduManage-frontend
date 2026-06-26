import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, AlertCircle } from 'lucide-react';
import './QrLoginModal.css';

export default function QrLoginModal({ open, onClose, onScan, loading, error }) {
  const [cameraError, setCameraError] = useState('');
  const scannerRef = useRef(null);
  const onScanRef = useRef(onScan);
  const readerId = 'qr-login-reader';

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    if (!open) return undefined;

    let cancelled = false;
    const scanner = new Html5Qrcode(readerId);
    scannerRef.current = scanner;

    const start = async () => {
      setCameraError('');
      try {
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (decodedText) => {
            if (cancelled) return;
            onScanRef.current?.(decodedText);
          },
          () => {}
        );
      } catch {
        if (!cancelled) {
          setCameraError('Impossible d\'accéder à la caméra. Autorisez l\'accès ou utilisez matricule + mot de passe.');
        }
      }
    };

    start();

    return () => {
      cancelled = true;
      const instance = scannerRef.current;
      scannerRef.current = null;
      if (instance?.isScanning) {
        instance.stop().catch(() => {});
      }
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="qr-login-modal" role="dialog" aria-modal="true" aria-labelledby="qr-login-title">
      <div className="qr-login-modal__backdrop" onClick={loading ? undefined : onClose} />
      <div className="qr-login-modal__panel">
        <div className="qr-login-modal__header">
          <div>
            <h2 id="qr-login-title">Connexion par carte scolaire</h2>
            <p>Scannez le QR code au verso de votre carte élève</p>
          </div>
          <button type="button" className="qr-login-modal__close" onClick={onClose} disabled={loading} aria-label="Fermer">
            <X size={20} />
          </button>
        </div>

        <div className="qr-login-modal__reader-wrap">
          <div id={readerId} className="qr-login-modal__reader" />
          {!cameraError && (
            <div className="qr-login-modal__hint">
              <Camera size={16} />
              Placez le QR code dans le cadre
            </div>
          )}
        </div>

        {cameraError && (
          <div className="qr-login-modal__alert qr-login-modal__alert--warn">
            <AlertCircle size={16} />
            {cameraError}
          </div>
        )}

        {error && (
          <div className="qr-login-modal__alert qr-login-modal__alert--error" role="alert">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {loading && <p className="qr-login-modal__loading">Connexion en cours…</p>}

        <button type="button" className="qr-login-modal__cancel" onClick={onClose} disabled={loading}>
          Annuler
        </button>
      </div>
    </div>
  );
}
