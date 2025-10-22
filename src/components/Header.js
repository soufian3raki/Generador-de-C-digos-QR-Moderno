import React from 'react';
import { QrCode } from 'lucide-react';
import './Header.css';

const Header = () => {
  return (
    <header className="header">
      <div className="header-content">
        <div className="logo">
          <QrCode className="logo-icon" />
          <h1>Generador QR</h1>
        </div>
        <p className="header-subtitle">
          Crea códigos QR gratuitos y personalizados al instante
        </p>
      </div>
    </header>
  );
};

export default Header;
