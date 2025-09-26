import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import "../styles/RestartTopicStatusModal.css";

function RestartTopicStatusModal({ isOpen, onClose, onConfirm, topicTitle }) {
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
                <h2>{t("restartTopicModal.title")}</h2>
                <p><strong>{topicTitle}</strong></p>
                <p>{t("restartTopicModal.message")}</p>
                <div className="top-modal-buttons">
                    <button onClick={onConfirm} className="top-confirm-button">
                        {t("restartTopicModal.confirm")}
                    </button>
                    <button onClick={onClose} className="top-cancel-button">
                        {t("restartTopicModal.cancel")}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default RestartTopicStatusModal;
