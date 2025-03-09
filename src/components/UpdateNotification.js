import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

const UpdateNotification = () => {
  const [showUpdateBar, setShowUpdateBar] = useState(false);

  useEffect(() => {
    // Registra um listener para atualização do service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        setShowUpdateBar(true);
      });
    }
  }, []);

  const handleUpdate = () => {
    window.location.reload();
  };

  if (!showUpdateBar) {
    return null;
  }

  return (
    <div className="update-notification">
      <p>Nova versão disponível!</p>
      <button className="update-button" onClick={handleUpdate}>
        <RefreshCw className="update-icon" /> Atualizar agora
      </button>
      <style jsx="true">{`
        .update-notification {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background-color: #3b82f6;
          color: white;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 10px;
          gap: 20px;
          z-index: 1001;
        }
        
        .update-button {
          display: flex;
          align-items: center;
          gap: 5px;
          background-color: white;
          color: #3b82f6;
          border: none;
          border-radius: 4px;
          padding: 5px 10px;
          font-weight: bold;
          cursor: pointer;
        }
        
        .update-icon {
          width: 16px;
          height: 16px;
        }
      `}</style>
    </div>
  );
};

export default UpdateNotification;