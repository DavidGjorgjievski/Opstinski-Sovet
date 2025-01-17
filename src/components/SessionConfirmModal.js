import React from 'react';
import '../styles/SessionConfirmModal.css'; 

function SessionConfirmModal({ show, onClose, onConfirm, sessionName }) {
    if (!show) {
        return null; 
    }

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Потврди Бришење</h2>
                <p>Дали сте сигурни дека сакате да ја избришете седницата:</p>
                <p><strong>{sessionName}</strong>?</p>
                <div className="modal-actions">
                    <button className="btn btn-danger" onClick={onConfirm}>Избриши</button>
                    <button className="btn btn-secondary" onClick={onClose}>Откажи</button>
                </div>
            </div>
        </div>
    );
}

export default SessionConfirmModal;
