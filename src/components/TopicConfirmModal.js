import React, { useEffect } from 'react';

function TopicConfirmModal({ isOpen, onClose, onConfirm, topicTitle }) {
    useEffect(() => {
        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    if (!isOpen) return null;

    return (
          <div className="modal-overlay">
            <div className="modal-content">
                <h2>Потврди Бришење</h2>
                <p>Дали сте сигурни дека сакате да ја избришете точката:</p>
                <p><strong>{topicTitle}</strong>?</p>
                <div className="modal-actions">
                    <button className="btn btn-danger" onClick={onConfirm}>Избриши</button>
                    <button className="btn btn-secondary" onClick={onClose}>Откажи</button>
                </div>
            </div>
        </div>
    );
}

export default TopicConfirmModal;
