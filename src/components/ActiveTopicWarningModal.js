import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import "../styles/TopicConfirmModal.css";

function ActiveTopicWarningModal({ isOpen, onClose, onConfirm, activeTopicTitle, keyPrefix = "activeTopicWarning" }) {
    const { t } = useTranslation();

    useEffect(() => {
        const handleEscape = (event) => {
            if (event.key === "Escape") onClose();
        };
        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [onClose]);

    if (!isOpen) return null;

    return (
        <div className="topic-modal-overlay">
            <div className="topic-modal-content">
                <h2>{t(`topicsPage.${keyPrefix}Title`)}</h2>
                <p>
                    {t(`topicsPage.${keyPrefix}NotFinished`)} <strong>"{activeTopicTitle}"</strong> {t(`topicsPage.${keyPrefix}NotFinishedSuffix`)}
                </p>
                <p>
                    {t(`topicsPage.${keyPrefix}Question`)}
                </p>

                <div className="topic-modal-actions">
                    <button className="btn-warning-modal" onClick={onConfirm}>
                        {t(`topicsPage.${keyPrefix}Confirm`)}
                    </button>
                    <button className="btn-cancel-modal" onClick={onClose}>
                        {t("topicsPage.cancelButton")}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ActiveTopicWarningModal;
