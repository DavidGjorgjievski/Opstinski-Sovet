import React from "react";
import { useTranslation } from "react-i18next";
import "../styles/SessionConfirmModal.css";

function SessionConfirmModal({ show, onClose, onConfirm, sessionName }) {
    const { t } = useTranslation(); // ✅ Enable translations

    // If modal is not active, don't render it
    if (!show) {
        return null;
    }

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                {/* Title */}
                <h2>{t("sessionModal.confirmDeleteTitle")}</h2>

                {/* Message */}
                <p>{t("sessionModal.confirmDeleteMessage")}</p>
                <p><strong>{sessionName}</strong>?</p>

                {/* Buttons */}
                <div className="modal-actions">
                    <button className="btn btn-danger" onClick={onConfirm}>
                        {t("sessionModal.deleteButton")}
                    </button>
                    <button className="btn btn-secondary" onClick={onClose}>
                        {t("sessionModal.cancelButton")}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default SessionConfirmModal;
