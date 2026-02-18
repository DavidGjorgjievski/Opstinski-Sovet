import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import "../styles/RestartTopicStatusModal.css"; // Reuse the same CSS

function RestartAmendmentStatusModal({ isOpen, onClose, onConfirm, amendmentTitle }) {
    const modalRef = useRef();
    const { t } = useTranslation();

    useEffect(() => {
        function handleClickOutside(event) {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                onClose();
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [onClose]);

    if (!isOpen) return null;

    return (
        <div className="top-modal-overlay">
            <div className="top-modal-content" ref={modalRef}>
                <h2>{t("restartAmendmentModal.title")}</h2>
                <p><strong>{amendmentTitle}</strong></p>
                <p>{t("restartAmendmentModal.message")}</p>
                <div className="top-modal-buttons">
                    <button onClick={onConfirm} className="top-confirm-button">
                        {t("restartAmendmentModal.confirm")}
                    </button>
                    <button onClick={onClose} className="btn-cancel-modal top-cancel-button">
                        {t("restartAmendmentModal.cancel")}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default RestartAmendmentStatusModal;
