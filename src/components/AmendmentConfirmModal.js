import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import "../styles/TopicConfirmModal.css"; // reuse same CSS

function AmendmentConfirmModal({ isOpen, onClose, onConfirm, amendmentTitle }) {
    const { t } = useTranslation();

    useEffect(() => {
        const handleEscape = (event) => {
            if (event.key === "Escape") {
                onClose();
            }
        };
        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [onClose]);

    if (!isOpen) return null;

    return (
        <div className="topic-modal-overlay">
            <div className="topic-modal-content">
                <h2>{t("amendments.confirmDeleteTitle")}</h2>
                <p>{t("amendments.confirmDeleteMessage")}</p>
                <p>
                    <strong>{amendmentTitle}</strong>?
                </p>

                <div className="topic-modal-actions">
                    <button className="btn-delete-modal" onClick={onConfirm}>
                        {t("amendments.confirmDeleteButton")}
                    </button>
                    <button className="btn-cancel-modal" onClick={onClose}>
                        {t("amendments.cancelButton")}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default AmendmentConfirmModal;
