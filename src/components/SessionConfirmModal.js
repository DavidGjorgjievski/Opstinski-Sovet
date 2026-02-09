import React from "react";
import { useTranslation } from "react-i18next";
import "../styles/SessionConfirmModal.css";

function SessionConfirmModal({ show, onClose, onConfirm, sessionName }) {
    const { t } = useTranslation();

    if (!show) {
        return null;
    }

    return (
        <div className="session-modal-overlay">
            <div className="session-modal-content">
                <h2>{t("sessionModal.confirmDeleteTitle")}</h2>

                <p>{t("sessionModal.confirmDeleteMessage")}</p>
                <p><strong>{sessionName}</strong>?</p>

                <div className="session-modal-actions">
                    <button className="btn-delete-modal" onClick={onConfirm}>
                        {t("sessionModal.deleteButton")}
                    </button>
                    <button className="btn-cancel-modal" onClick={onClose}>
                        {t("sessionModal.cancelButton")}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default SessionConfirmModal;
