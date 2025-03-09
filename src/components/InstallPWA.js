import React, { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import '../styles/StatusIndicators.css'; // Importar os estilos que criamos

const InstallPWA = () => {
  const [supportsPWA, setSupportsPWA] = useState(false);
  const [promptInstall, setPromptInstall] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showBanner, setShowBanner] = useState(true);

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
      if (window.matchMedia('(display-mode: standalone)').matches || 
          window.navigator.standalone) { // Suporte para iOS
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

  const handleDismiss = () => {
    setShowBanner(false);
  };

  // Não exibir nada se o PWA não for suportado, já estiver instalado ou o banner foi fechado
  if (!supportsPWA || isInstalled || !showBanner) {
    return null;
  }

  return (
    <div className="pwa-install-banner">
      <div className="pwa-install-content">
        <div className="pwa-install-icon">
          <Download />
        </div>
        <div className="pwa-install-message">
          <h3>Instale nosso aplicativo</h3>
          <p>Adicione Cases de Co-criação à sua tela inicial para acesso rápido e offline</p>
        </div>
      </div>
      <div className="pwa-install-actions">
        <button className="pwa-install-button" onClick={handleInstallClick}>
          Instalar
        </button>
        <button className="pwa-close-button" onClick={handleDismiss}>
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default InstallPWA;