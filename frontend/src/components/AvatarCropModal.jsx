import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';

const OUTPUT_SIZE = 512;

/**
 * Lädt das Bild aus einer Blob-/Data-URL und rendert den vom User
 * gewählten Crop-Ausschnitt auf ein quadratisches Canvas der Größe
 * OUTPUT_SIZE × OUTPUT_SIZE. Gibt ein JPEG-Blob zurück.
 */
async function cropToBlob(imageSrc, croppedAreaPixels) {
  const image = await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = imageSrc;
  });

  const canvas = document.createElement('canvas');
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const ctx = canvas.getContext('2d');

  ctx.drawImage(
    image,
    croppedAreaPixels.x,
    croppedAreaPixels.y,
    croppedAreaPixels.width,
    croppedAreaPixels.height,
    0,
    0,
    OUTPUT_SIZE,
    OUTPUT_SIZE
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.9);
  });
}

function AvatarCropModal({ file, onCancel, onSave }) {
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImageSrc(reader.result);
    reader.readAsDataURL(file);
  }, [file]);

  const onCropComplete = useCallback((_, areaPixels) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  async function handleSave() {
    if (!croppedAreaPixels || !imageSrc) return;
    setSaving(true);
    try {
      const blob = await cropToBlob(imageSrc, croppedAreaPixels);
      const cropped = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
      await onSave(cropped);
    } finally {
      setSaving(false);
    }
  }

  if (!file) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 2000, padding: '16px',
      }}
      onClick={onCancel}
    >
      <div
        className="card"
        style={{ maxWidth: '500px', width: '100%', padding: '20px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ fontFamily: 'var(--font-heading)', marginBottom: '16px' }}>Profilbild zuschneiden</h3>
        <p style={{ fontSize: '0.85rem', color: '#5a6878', marginBottom: '12px' }}>
          Verschieben &amp; Zoomen, bis der gewünschte Ausschnitt im Kreis liegt.
        </p>

        <div style={{ position: 'relative', width: '100%', height: '320px', background: '#000', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              restrictPosition={true}
            />
          )}
        </div>

        <div style={{ marginTop: '16px' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', color: '#5a6878', marginBottom: '6px' }}>
            Zoom
          </label>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
          <button type="button" className="btn btn-outline" onClick={onCancel} disabled={saving}>
            Abbrechen
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving || !croppedAreaPixels}>
            {saving ? 'Lädt hoch…' : 'Übernehmen'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AvatarCropModal;
