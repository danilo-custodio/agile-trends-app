import React, { useState } from 'react';
import { RefreshCw, X } from 'lucide-react';
import '../styles/UpdateNotification.css';

const UpdateNotification = ({ onUpdate }) => {
  const [visible, setVisible] = useState(true);

  const handleClose = () => {
    setVisible(false);
  };

  const handleUpdate = () => {
    if (onUpdate) {
      onUpdate();
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="update-notification">
      <div className="update-content">
        <RefreshCw className="update-icon" />
        <div className="update-message">
          <h3>Novos conteúdos disponíveis</h3>
          <p>Atualizações foram encontradas para os cases de co-criação</p>
        </div>
      </div>
      <div className="update-actions">
        <button className="update-button" onClick={handleUpdate}>
          Atualizar agora
        </button>
        <button className="dismiss-button" onClick={handleClose}>
          Mais tarde
        </button>
      </div>
    </div>
  );
};

export default UpdateNotification;