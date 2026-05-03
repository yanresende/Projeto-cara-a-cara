import React, {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from 'react';
import './CropEditor.css';

const PREVIEW_SIZE = 290;
const OUTPUT_SIZE = 800;
const JPEG_QUALITY = 0.82;

export interface CropEditorRef {
  getCroppedBlob: () => Promise<Blob>;
}

interface Props {
  file: File;
}

export const CropEditor = forwardRef<CropEditorRef, Props>(({ file }, ref) => {
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 });
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const objectUrl = useRef('');
  const dragRef = useRef<{ sx: number; sy: number; px: number; py: number } | null>(null);
  const isDragging = dragRef.current !== null;

  // Refs para capturar sempre os valores mais recentes no getCroppedBlob
  const posRef = useRef(pos);
  const zoomRef = useRef(zoom);
  const naturalSizeRef = useRef(naturalSize);
  useEffect(() => { posRef.current = pos; }, [pos]);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { naturalSizeRef.current = naturalSize; }, [naturalSize]);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    objectUrl.current = url;
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      setNaturalSize({ w, h });
      const baseScale = Math.max(PREVIEW_SIZE / w, PREVIEW_SIZE / h);
      setPos({
        x: (PREVIEW_SIZE - w * baseScale) / 2,
        y: (PREVIEW_SIZE - h * baseScale) / 2,
      });
      setZoom(1);
    };
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const baseScale = naturalSize.w > 0
    ? Math.max(PREVIEW_SIZE / naturalSize.w, PREVIEW_SIZE / naturalSize.h)
    : 1;
  const totalScale = baseScale * zoom;
  const dW = naturalSize.w * totalScale;
  const dH = naturalSize.h * totalScale;

  function clamp(p: { x: number; y: number }, dw = dW, dh = dH) {
    return {
      x: Math.min(0, Math.max(PREVIEW_SIZE - dw, p.x)),
      y: Math.min(0, Math.max(PREVIEW_SIZE - dh, p.y)),
    };
  }

  const cPos = clamp(pos);

  function startDrag(clientX: number, clientY: number) {
    dragRef.current = { sx: clientX, sy: clientY, px: pos.x, py: pos.y };
  }

  function moveDrag(clientX: number, clientY: number) {
    if (!dragRef.current) return;
    setPos(clamp({
      x: dragRef.current.px + (clientX - dragRef.current.sx),
      y: dragRef.current.py + (clientY - dragRef.current.sy),
    }));
  }

  function endDrag() {
    dragRef.current = null;
  }

  function handleZoom(e: React.ChangeEvent<HTMLInputElement>) {
    const newZoom = parseFloat(e.target.value);
    const oldTs = baseScale * zoom;
    const newTs = baseScale * newZoom;
    const newDW = naturalSize.w * newTs;
    const newDH = naturalSize.h * newTs;

    // Centro fixo durante zoom
    const cx = PREVIEW_SIZE / 2;
    const cy = PREVIEW_SIZE / 2;
    const imgCx = (cx - cPos.x) / oldTs;
    const imgCy = (cy - cPos.y) / oldTs;

    setZoom(newZoom);
    setPos(clamp(
      { x: cx - imgCx * newTs, y: cy - imgCy * newTs },
      newDW,
      newDH,
    ));
  }

  useImperativeHandle(ref, () => ({
    getCroppedBlob(): Promise<Blob> {
      return new Promise((resolve, reject) => {
        const { w, h } = naturalSizeRef.current;
        const bs = w > 0 ? Math.max(PREVIEW_SIZE / w, PREVIEW_SIZE / h) : 1;
        const ts = bs * zoomRef.current;
        const dw = w * ts;
        const dh = h * ts;
        const cp = clamp(posRef.current, dw, dh);

        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = OUTPUT_SIZE;
          canvas.height = OUTPUT_SIZE;
          const ctx = canvas.getContext('2d')!;
          const srcX = -cp.x / ts;
          const srcY = -cp.y / ts;
          const srcSize = PREVIEW_SIZE / ts;
          ctx.drawImage(img, srcX, srcY, srcSize, srcSize, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
          canvas.toBlob(
            blob => (blob ? resolve(blob) : reject(new Error('Crop falhou'))),
            'image/jpeg',
            JPEG_QUALITY
          );
        };
        img.onerror = reject;
        img.src = objectUrl.current;
      });
    },
  }), []);

  return (
    <div className="crop-editor">
      <div
        className={`crop-container${isDragging ? ' dragging' : ''}`}
        style={{ width: PREVIEW_SIZE, height: PREVIEW_SIZE }}
        onMouseDown={e => { e.preventDefault(); startDrag(e.clientX, e.clientY); }}
        onMouseMove={e => moveDrag(e.clientX, e.clientY)}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
      >
        {objectUrl.current && (
          <img
            src={objectUrl.current}
            alt="crop"
            draggable={false}
            style={{
              position: 'absolute',
              width: dW,
              height: dH,
              left: cPos.x,
              top: cPos.y,
              userSelect: 'none',
              pointerEvents: 'none',
            }}
          />
        )}
        <div className="crop-border" />
      </div>

      <div className="crop-controls">
        <span className="crop-zoom-icon">🔍</span>
        <input
          type="range"
          min={1}
          max={4}
          step={0.05}
          value={zoom}
          onChange={handleZoom}
          className="crop-slider"
        />
        <span className="crop-zoom-value">{zoom.toFixed(1)}×</span>
      </div>

      <p className="crop-hint">Arraste para reposicionar · Slider para zoom</p>
    </div>
  );
});
