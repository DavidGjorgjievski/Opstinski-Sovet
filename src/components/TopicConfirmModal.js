import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

function TopicConfirmModal({ isOpen, onClose, onConfirm, topicTitle }) {

    const { t } = useTranslation();
    
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
                <h2>{t("topicsPage.confirmDeleteTitle")}</h2>
                <p>{t("topicsPage.confirmDeleteMessage")}</p>
                <p><strong>{topicTitle}</strong>?</p>
                <div className="modal-actions">
                <button className="btn btn-danger" onClick={onConfirm}>
                    {t("topicsPage.confirmDeleteButton")}
                </button>
                <button className="btn btn-secondary" onClick={onClose}>
                    {t("topicsPage.cancelButton")}
                </button>
                </div>
            </div>
        </div>
    );
}

export default TopicConfirmModal;
