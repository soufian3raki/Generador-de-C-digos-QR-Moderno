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

  const downloadQR = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `qr-code-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
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
            <button onClick={downloadQR} className="action-button primary">
              <Download size={16} />
              Descargar PNG
            </button>
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
