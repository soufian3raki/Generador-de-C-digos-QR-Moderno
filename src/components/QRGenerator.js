import React, { useState } from 'react';
import { Settings, Link, Text, Mail, Phone, MapPin, Image, Upload } from 'lucide-react';
import './QRGenerator.css';

const QRGenerator = ({ onDataChange, onOptionsChange, options }) => {
  const [inputData, setInputData] = useState('');
  const [qrType, setQrType] = useState('text');
  const [showOptions, setShowOptions] = useState(false);

  const qrTypes = [
    { id: 'text', label: 'Texto', icon: Text },
    { id: 'url', label: 'URL', icon: Link },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'phone', label: 'Teléfono', icon: Phone },
    { id: 'location', label: 'Ubicación', icon: MapPin }
  ];

  const handleDataChange = (value) => {
    setInputData(value);
    onDataChange(value);
  };

  const handleTypeChange = (type) => {
    setQrType(type);
    setInputData('');
    onDataChange('');
  };

  const handleOptionChange = (key, value) => {
    const newOptions = { ...options, [key]: value };
    onOptionsChange(newOptions);
  };

  const handleLogoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        // Ajustar automáticamente el tamaño del logo para mantener escaneabilidad
        const optimalLogoSize = Math.min(25, options.logoSize || 25);
        const newOptions = { 
          ...options, 
          logo: e.target.result,
          logoSize: optimalLogoSize
        };
        onOptionsChange(newOptions);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    const newOptions = { ...options, logo: null };
    onOptionsChange(newOptions);
  };

  const getPlaceholder = () => {
    switch (qrType) {
      case 'url': return 'https://ejemplo.com';
      case 'email': return 'correo@ejemplo.com';
      case 'phone': return '+1234567890';
      case 'location': return 'Latitud, Longitud (ej: 40.7128, -74.0060)';
      default: return 'Ingresa tu texto aquí...';
    }
  };

  return (
    <div className="qr-generator">
      <div className="generator-card">
        <h2>Configuración</h2>
        
        <div className="type-selector">
          <label>Tipo de código QR:</label>
          <div className="type-buttons">
            {qrTypes.map(type => {
              const Icon = type.icon;
              return (
                <button
                  key={type.id}
                  className={`type-button ${qrType === type.id ? 'active' : ''}`}
                  onClick={() => handleTypeChange(type.id)}
                >
                  <Icon size={16} />
                  {type.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="input-section">
          <label htmlFor="qr-data">Contenido:</label>
          <textarea
            id="qr-data"
            value={inputData}
            onChange={(e) => handleDataChange(e.target.value)}
            placeholder={getPlaceholder()}
            rows={qrType === 'text' ? 4 : 2}
          />
        </div>

        <button
          className="options-toggle"
          onClick={() => setShowOptions(!showOptions)}
        >
          <Settings size={16} />
          Opciones avanzadas
        </button>

        {showOptions && (
          <div className="options-panel">
            <div className="option-group">
              <label htmlFor="size">Tamaño:</label>
              <input
                id="size"
                type="range"
                min="100"
                max="500"
                value={options.size}
                onChange={(e) => handleOptionChange('size', parseInt(e.target.value))}
              />
              <span>{options.size}px</span>
            </div>

            <div className="option-group">
              <label htmlFor="color">Color:</label>
              <input
                id="color"
                type="color"
                value={options.color}
                onChange={(e) => handleOptionChange('color', e.target.value)}
              />
            </div>

            <div className="option-group">
              <label htmlFor="bg-color">Color de fondo:</label>
              <input
                id="bg-color"
                type="color"
                value={options.backgroundColor}
                onChange={(e) => handleOptionChange('backgroundColor', e.target.value)}
              />
            </div>

            <div className="option-group">
              <label htmlFor="margin">Márgenes:</label>
              <input
                id="margin"
                type="range"
                min="0"
                max="10"
                value={options.margin}
                onChange={(e) => handleOptionChange('margin', parseInt(e.target.value))}
              />
              <span>{options.margin}</span>
            </div>

            <div className="option-group">
              <label htmlFor="error-level">Nivel de corrección:</label>
              <select
                id="error-level"
                value={options.logo ? 'H' : options.errorCorrectionLevel}
                onChange={(e) => handleOptionChange('errorCorrectionLevel', e.target.value)}
                disabled={options.logo}
              >
                <option value="L">Bajo (L)</option>
                <option value="M">Medio (M)</option>
                <option value="Q">Alto (Q)</option>
                <option value="H">Máximo (H)</option>
              </select>
              {options.logo && (
                <small className="correction-info">
                  Ajustado automáticamente a Máximo (H) para mantener escaneabilidad con logo
                </small>
              )}
            </div>

            <div className="option-group logo-section">
              <label>Logo:</label>
              <div className="logo-controls">
                <input
                  type="file"
                  id="logo-upload"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  style={{ display: 'none' }}
                />
                <button
                  className="logo-upload-btn"
                  onClick={() => document.getElementById('logo-upload').click()}
                >
                  <Upload size={16} />
                  Subir Logo
                </button>
                
                {options.logo && (
                  <div className="logo-preview">
                    <img src={options.logo} alt="Logo preview" />
                    <button onClick={removeLogo} className="remove-logo-btn">
                      ✕
                    </button>
                  </div>
                )}
              </div>
              
              {options.logo && (
                <div className="option-group">
                  <label htmlFor="logo-size">Tamaño del logo:</label>
                  <input
                    id="logo-size"
                    type="range"
                    min="15"
                    max="25"
                    value={options.logoSize}
                    onChange={(e) => handleOptionChange('logoSize', parseInt(e.target.value))}
                  />
                  <span>{options.logoSize}%</span>
                  <small className="logo-info">
                    Tamaño optimizado para mantener escaneabilidad
                  </small>
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default QRGenerator;
