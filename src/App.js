import React, { useState } from 'react';
import QRGenerator from './components/QRGenerator';
import QRDisplay from './components/QRDisplay';
import Header from './components/Header';
import './App.css';

function App() {
  const [qrData, setQrData] = useState('');
  const [qrOptions, setQrOptions] = useState({
    size: 200,
    color: '#000000',
    backgroundColor: '#ffffff',
    margin: 4,
    errorCorrectionLevel: 'M',
    logo: null,
    logoSize: 20,
    borderStyle: 'none',
    borderColor: '#000000',
    borderWidth: 2
  });

  return (
    <div className="App">
      <Header />
      <main className="main-container">
        <div className="content-wrapper">
          <QRGenerator 
            onDataChange={setQrData}
            onOptionsChange={setQrOptions}
            options={qrOptions}
          />
          <QRDisplay 
            data={qrData}
            options={qrOptions}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
