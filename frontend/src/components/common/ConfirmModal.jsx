import React from 'react';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="confirm-modal-overlay">
      <div className="confirm-modal-card">
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="confirm-modal-actions">
          <button className="confirm-cancel-btn" onClick={onClose}>Cancel</button>
          <button className="confirm-ok-btn" onClick={onConfirm}>Remove</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
