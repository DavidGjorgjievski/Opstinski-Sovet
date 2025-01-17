import React from 'react';
import '../styles/ConfirmModal.css';

const ConfirmModal = ({ show, onClose, onConfirm, userName, errorMessage }) => {
    if (!show) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                {errorMessage ? (
                    <>
                        <h2>Грешка</h2>
                        <p className="text-danger">{errorMessage}</p>
                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={onClose}>Затвори</button>
                        </div>
                    </>
                ) : (
                    <>
                        <h2>Дали си сигурен?</h2>
                        <p>Дали сакате да го избришете корисникот <strong>{userName}</strong>?</p>
                        <div className="modal-actions">
                            <button className="btn btn-danger" onClick={onConfirm}>Избриши</button>
                            <button className="btn btn-secondary" onClick={onClose}>Откажи</button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ConfirmModal;
