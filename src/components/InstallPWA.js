import React, { useEffect, useState } from 'react';
import { Download } from 'lucide-react';

const InstallPWA = () => {
  const [supportsPWA, setSupportsPWA] = useState(false);
  const [promptInstall, setPromptInstall] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      console.log('Evento beforeinstallprompt acionado');
      setSupportsPWA(true);
      setPromptInstall(e);
    };
    
    window.addEventListener('beforeinstallprompt', handler);

    // Verifica se o app já está instalado
    const checkInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
      }
    };
    
    checkInstalled();
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = (e) => {
    e.preventDefault();
    if (!promptInstall) {
      return;
    }
    promptInstall.prompt();
    promptInstall.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('Usuário aceitou a instalação');
        setIsInstalled(true);
      } else {
        console.log('Usuário recusou a instalação');
      }
      setPromptInstall(null);
    });
  };

  if (!supportsPWA || isInstalled) {
    return null;
  }

  return (
    <div className="install-container">
      <button 
        className="install-button" 
        onClick={handleInstallClick}
      >
        <Download className="install-icon" />
        <span>Instalar App</span>
      </button>
      <style jsx="true">{`
        .install-container {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 1000;
        }
        
        .install-button {
          display: flex;
          align-items: center;
          gap: 8px;
          background-color: #3b82f6;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: bold;
          cursor: pointer;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          transition: all 0.2s;
        }
        
        .install-button:hover {
          background-color: #2563eb;
          transform: translateY(-2px);
        }
        
        .install-icon {
          width: 20px;
          height: 20px;
        }
      `}</style>
    </div>
  );
};

export default InstallPWA;