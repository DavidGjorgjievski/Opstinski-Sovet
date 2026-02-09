// src/components/MandateConfirmModal.js
import React from "react";
import { useTranslation } from "react-i18next";
import "../styles/MandateConfirmModal.css"; // or reuse SessionConfirmModal.css

function MandateConfirmModal({ show, onClose, onConfirm, mandateName }) {
    const { t } = useTranslation();

    if (!show) return null;

    return (
        <div className="session-modal-overlay">
            <div className="session-modal-content">
                <h2>{t("mandateModal.confirmDeleteTitle")}</h2>

                <p>{t("mandateModal.confirmDeleteMessage")}</p>
                <p><strong>{mandateName}</strong>?</p>

                <div className="session-modal-actions">
                    <button className="btn-delete-modal" onClick={onConfirm}>
                        {t("mandateModal.deleteButton")}
                    </button>
                    <button className="btn-cancel-modal" onClick={onClose}>
                        {t("mandateModal.cancelButton")}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default MandateConfirmModal; 
