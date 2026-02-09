import React from 'react';
import '../styles/ConfirmModal.css';
import { useTranslation } from 'react-i18next';

const ConfirmModal = ({ show, onClose, onConfirm, userName, errorMessage }) => {
    const { t } = useTranslation();

    if (!show) return null;

    return (
        <div className="user-modal-overlay">
            <div className="user-modal-content">
                {errorMessage ? (
                    <>
                        <h2>{t("confirmModal.errorTitle")}</h2>
                        <p className="user-text-danger">{errorMessage}</p>
                        <div className="user-modal-actions">
                            <button className="user-btn user-btn-secondary" onClick={onClose}>
                                {t("confirmModal.close")}
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <h2>{t("confirmModal.title")}</h2>
                        <p>
                            {t("confirmModal.message")} <strong>{userName}</strong>?
                        </p>
                        <div className="user-modal-actions">
                            <button className="btn-delete-modal" onClick={onConfirm}>
                                {t("confirmModal.delete")}
                            </button>
                            <button className="btn-cancel-modal" onClick={onClose}>
                                {t("confirmModal.cancel")}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ConfirmModal;
