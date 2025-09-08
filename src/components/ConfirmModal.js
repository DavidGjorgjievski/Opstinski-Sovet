import React from 'react';
import '../styles/ConfirmModal.css';
import { useTranslation } from 'react-i18next';

const ConfirmModal = ({ show, onClose, onConfirm, userName, errorMessage }) => {
    const { t } = useTranslation();

    if (!show) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                {errorMessage ? (
                    <>
                        <h2>{t("confirmModal.errorTitle")}</h2>
                        <p className="text-danger">{errorMessage}</p>
                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={onClose}>
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
                        <div className="modal-actions">
                            <button className="btn btn-danger" onClick={onConfirm}>
                                {t("confirmModal.delete")}
                            </button>
                            <button className="btn btn-secondary" onClick={onClose}>
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
