import React from "react";
import { useTranslation } from "react-i18next";
import "../styles/NoTopicsExportModal.css";

function NoTopicsExportModal({ show, onClose }) {
    const { t } = useTranslation();

    if (!show) return null;

    return (
        <div className="no-topics-modal-overlay">
            <div className="no-topics-modal-content">
                <h2>{t("NoTopicsExportModal.noTopicsTitle")}</h2>
                <p>{t("NoTopicsExportModal.noTopicsMessage")}</p>
                <div className="no-topics-modal-actions">
                    <button
                        className="btn-cancel-modal"
                        onClick={onClose}
                    >
                        {t("NoTopicsExportModal.closeButton")}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default NoTopicsExportModal;
