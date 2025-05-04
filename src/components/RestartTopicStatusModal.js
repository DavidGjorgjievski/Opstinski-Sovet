import { useEffect, useRef } from 'react';
import '../styles/RestartTopicStatusModal.css';

function RestartTopicStatusModal({ isOpen, onClose, onConfirm, topicTitle }) {
    const modalRef = useRef();

    useEffect(() => {
        function handleClickOutside(event) {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                onClose();
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    if (!isOpen) return null;

    return (
        <div className="top-modal-overlay">
            <div className="top-modal-content" ref={modalRef}>
                <h2>Потврда за повторно гласање</h2>
                <p><strong>{topicTitle}</strong></p>
                <p>
                    Дали сте сигурни дека сакате да ја рестартирате точката за повторно гласање?
                </p>
                <div className="top-modal-buttons">
                    <button onClick={onConfirm} className="top-confirm-button">Да</button>
                    <button onClick={onClose} className="top-cancel-button">Откажи</button>
                </div>
            </div>
        </div>
    );
}

export default RestartTopicStatusModal;
