import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import "../styles/RestartTopicStatusModal.css";

function RemoveCommissionConfirmModal({ isOpen, onClose, onConfirm, commissionName }) {
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
                <h2>{t("addTopicForm.removeCommissionTitle")}</h2>
                <p><strong>{commissionName}</strong></p>
                <p>{t("addTopicForm.removeCommissionMessage")}</p>
                <div className="top-modal-buttons">
                    <button onClick={onConfirm} className="top-confirm-button">
                        {t("addTopicForm.removeCommissionConfirm")}
                    </button>
                    <button onClick={onClose} className="btn-cancel-modal top-cancel-button">
                        {t("addTopicForm.removeCommissionCancel")}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default RemoveCommissionConfirmModal;
