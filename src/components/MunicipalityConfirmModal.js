import React from 'react';
import '../styles/MunicipalityConfirmModal.css'

function MunicipalityConfirmModal({ show, onClose, onConfirm, municipalityName }) {
  if (!show) {
        return null; 
    }

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Потврди Бришење</h2>
                <p>Дали сте сигурни дека сакате да ја избришете општината:</p>
                <p><strong>{municipalityName}</strong>?</p>
                <div className="modal-actions">
                    <button className="btn btn-danger" onClick={onConfirm}>Избриши</button>
                    <button className="btn btn-secondary" onClick={onClose}>Откажи</button>
                </div>
            </div>
        </div>
    );
}

export default MunicipalityConfirmModal;
