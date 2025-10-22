import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Download, Copy, RefreshCw } from 'lucide-react';
import './QRDisplay.css';

const QRDisplay = ({ data, options }) => {
  const canvasRef = useRef(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    generateQR();
  }, [data, options]);

  const addLogoToQR = (canvas, logoDataUrl, logoSizePercent) => {
    const ctx = canvas.getContext('2d');
    const canvasSize = canvas.width;
    
    // Calcular tamaño óptimo del logo basado en el tamaño del QR
    // Máximo 25% del tamaño del QR para mantener escaneabilidad
    const maxLogoSize = canvasSize * 0.25;
    const logoSize = Math.min((canvasSize * logoSizePercent) / 100, maxLogoSize);
    
    // Crear imagen del logo
    const logoImg = new Image();
    logoImg.onload = () => {
      // Calcular posición centrada
      const x = (canvasSize - logoSize) / 2;
      const y = (canvasSize - logoSize) / 2;
      
      // Dibujar fondo blanco para el logo con margen
      const margin = Math.max(2, logoSize * 0.1);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x - margin, y - margin, logoSize + (margin * 2), logoSize + (margin * 2));
      
      // Dibujar el logo
      ctx.drawImage(logoImg, x, y, logoSize, logoSize);
    };
    logoImg.src = logoDataUrl;
  };

  const generateQR = async () => {
    if (!data.trim()) {
      setError(null);
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const qrOptions = {
        width: options.size,
        margin: options.margin,
        color: {
          dark: options.color,
          light: options.backgroundColor
        },
        // Ajustar automáticamente el nivel de corrección si hay logo
        errorCorrectionLevel: options.logo ? 'H' : options.errorCorrectionLevel
      };

      await QRCode.toCanvas(canvas, data, qrOptions);
      
      // Añadir logo si existe
      if (options.logo) {
        addLogoToQR(canvas, options.logo, options.logoSize);
      }
    } catch (err) {
      setError('Error al generar el código QR. Verifica que el contenido sea válido.');
      console.error('QR Generation Error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadQR = (format = 'png') => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const timestamp = Date.now();
    const link = document.createElement('a');
    
    switch (format) {
      case 'png':
        link.download = `qr-code-${timestamp}.png`;
        link.href = canvas.toDataURL('image/png');
        break;
      case 'jpg':
        link.download = `qr-code-${timestamp}.jpg`;
        link.href = canvas.toDataURL('image/jpeg', 0.9);
        break;
      case 'svg':
        downloadSVG();
        return;
    }
    
    link.click();
  };

  const downloadSVG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Crear SVG basado en el canvas
    const svgData = generateSVGFromCanvas(canvas);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.download = `qr-code-${Date.now()}.svg`;
    link.href = url;
    link.click();
    
    URL.revokeObjectURL(url);
  };

  const generateSVGFromCanvas = (canvas) => {
    const width = canvas.width;
    const height = canvas.height;
    
    // Obtener los datos de imagen del canvas
    const imageData = canvas.getContext('2d').getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Crear el SVG
    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
    
    // Añadir fondo
    svg += `<rect width="100%" height="100%" fill="${options.backgroundColor}"/>`;
    
    // Procesar píxeles para crear rectángulos
    const moduleSize = detectModuleSize(canvas, data);
    
    for (let y = 0; y < height; y += moduleSize) {
      for (let x = 0; x < width; x += moduleSize) {
        if (isModuleDark(x, y, moduleSize, width, data)) {
          svg += `<rect x="${x}" y="${y}" width="${moduleSize}" height="${moduleSize}" fill="${options.color}"/>`;
        }
      }
    }
    
    // Añadir logo si existe
    if (options.logo) {
      const logoSize = (width * options.logoSize) / 100;
      const logoX = (width - logoSize) / 2;
      const logoY = (height - logoSize) / 2;
      const margin = Math.max(2, logoSize * 0.1);
      
      svg += `<rect x="${logoX - margin}" y="${logoY - margin}" width="${logoSize + margin * 2}" height="${logoSize + margin * 2}" fill="#ffffff"/>`;
      svg += `<image x="${logoX}" y="${logoY}" width="${logoSize}" height="${logoSize}" href="${options.logo}"/>`;
    }
    
    // Añadir borde si existe
    if (options.borderStyle !== 'none') {
      const borderWidth = options.borderWidth;
      svg += `<rect x="0" y="0" width="${width}" height="${height}" fill="none" stroke="${options.borderColor}" stroke-width="${borderWidth}" stroke-dasharray="${options.borderStyle === 'dashed' ? '5,5' : options.borderStyle === 'dotted' ? '1,3' : 'none'}"/>`;
    }
    
    svg += '</svg>';
    return svg;
  };

  const detectModuleSize = (canvas, data) => {
    const width = canvas.width;
    const height = canvas.height;
    
    let moduleSize = 1;
    const sampleRows = Math.min(10, height);
    
    for (let row = 0; row < sampleRows; row++) {
      let currentSize = 1;
      let inModule = false;
      
      for (let x = 1; x < width; x++) {
        const pixelIndex = (row * width + x) * 4;
        const prevPixelIndex = (row * width + x - 1) * 4;
        
        const r = data[pixelIndex];
        const g = data[pixelIndex + 1];
        const b = data[pixelIndex + 2];
        const prevR = data[prevPixelIndex];
        const prevG = data[prevPixelIndex + 1];
        const prevB = data[prevPixelIndex + 2];
        
        const isDark = (r + g + b) / 3 < 128;
        const wasDark = (prevR + prevG + prevB) / 3 < 128;
        
        if (isDark !== wasDark) {
          if (inModule) {
            moduleSize = Math.max(moduleSize, currentSize);
            currentSize = 1;
          } else {
            inModule = true;
            currentSize = 1;
          }
        } else if (inModule) {
          currentSize++;
        }
      }
    }
    
    return Math.max(1, Math.min(moduleSize, width / 10));
  };

  const isModuleDark = (x, y, moduleSize, width, data) => {
    const sampleSize = Math.max(1, Math.floor(moduleSize / 2));
    let darkPixels = 0;
    let totalPixels = 0;
    
    for (let dy = 0; dy < moduleSize; dy += sampleSize) {
      for (let dx = 0; dx < moduleSize; dx += sampleSize) {
        const pixelX = x + dx;
        const pixelY = y + dy;
        
        if (pixelX < width && pixelY < width) {
          const pixelIndex = (pixelY * width + pixelX) * 4;
          const r = data[pixelIndex];
          const g = data[pixelIndex + 1];
          const b = data[pixelIndex + 2];
          
          const brightness = (r + g + b) / 3;
          if (brightness < 128) {
            darkPixels++;
          }
          totalPixels++;
        }
      }
    }
    
    return totalPixels > 0 && darkPixels / totalPixels > 0.5;
  };

  const copyQR = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      canvas.toBlob(async (blob) => {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        // Mostrar notificación de éxito
        alert('Código QR copiado al portapapeles');
      });
    } catch (err) {
      console.error('Error copying QR code:', err);
      alert('No se pudo copiar el código QR');
    }
  };

  return (
    <div className="qr-display">
      <div className="display-card">
        <h2>Vista previa</h2>
        
        <div className="qr-container">
          {!data.trim() ? (
            <div className="placeholder">
              <RefreshCw size={48} className="placeholder-icon" />
              <p>Ingresa contenido para generar tu código QR</p>
            </div>
          ) : error ? (
            <div className="error-message">
              <p>{error}</p>
              <button onClick={generateQR} className="retry-button">
                <RefreshCw size={16} />
                Reintentar
              </button>
            </div>
          ) : (
            <div className="qr-wrapper">
              <canvas
                ref={canvasRef}
                className="qr-canvas"
                style={{
                  opacity: isGenerating ? 0.5 : 1,
                  transition: 'opacity 0.3s ease',
                  border: options.borderStyle !== 'none' 
                    ? `${options.borderWidth}px ${options.borderStyle} ${options.borderColor}`
                    : 'none'
                }}
              />
              {isGenerating && (
                <div className="loading-overlay">
                  <RefreshCw size={24} className="loading-spinner" />
                  <span>Generando...</span>
                </div>
              )}
            </div>
          )}
        </div>

        {data.trim() && !error && (
          <div className="action-buttons">
            <div className="download-buttons">
              <button onClick={() => downloadQR('png')} className="action-button primary">
                <Download size={16} />
                PNG
              </button>
              <button onClick={() => downloadQR('jpg')} className="action-button primary">
                <Download size={16} />
                JPG
              </button>
              <button onClick={() => downloadQR('svg')} className="action-button primary">
                <Download size={16} />
                SVG
              </button>
            </div>
            <button onClick={copyQR} className="action-button secondary">
              <Copy size={16} />
              Copiar
            </button>
          </div>
        )}

        {data.trim() && (
          <div className="qr-info">
            <h3>Información del código QR</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Tamaño:</span>
                <span className="info-value">{options.size}px</span>
              </div>
              <div className="info-item">
                <span className="info-label">Márgenes:</span>
                <span className="info-value">{options.margin}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Corrección:</span>
                <span className="info-value">{options.errorCorrectionLevel}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Caracteres:</span>
                <span className="info-value">{data.length}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Borde:</span>
                <span className="info-value">
                  {options.borderStyle === 'none' ? 'Sin borde' : 
                   options.borderStyle === 'solid' ? 'Sólido' :
                   options.borderStyle === 'dashed' ? 'Discontinuo' :
                   options.borderStyle === 'dotted' ? 'Punteado' : 'Sin borde'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRDisplay;
