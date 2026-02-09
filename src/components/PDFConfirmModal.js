import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import "../styles/PDFConfirmModal.css";

function PDFConfirmModal({ isOpen, onClose, onConfirm, pdfName }) {
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
        <div className="pdf-modal-overlay">
            <div className="pdf-modal-content">
                {/* Modal Title */}
                <h2>{t("pdfConfirmModal.title")}</h2>

                {/* Modal Message */}
                <p>{t("pdfConfirmModal.message")}</p>

                {/* PDF Name */}
                <p>
                    <strong>{pdfName}</strong>?
                </p>

                {/* Action Buttons */}
                <div className="pdf-modal-actions">
                    <button className="btn-delete-modal" onClick={onConfirm}>
                        {t("pdfConfirmModal.removeButton")}
                    </button>
                    <button className="btn-cancel-modal" onClick={onClose}>
                        {t("pdfConfirmModal.cancelButton")}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default PDFConfirmModal;
