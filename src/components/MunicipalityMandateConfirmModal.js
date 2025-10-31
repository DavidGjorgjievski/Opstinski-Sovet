import React from "react";
import { useTranslation } from "react-i18next";
import "../styles/MunicipalityMandateConfirmModal.css";

function MunicipalityMandateConfirmModal({ show, onClose, onConfirm, mandateName }) {
    const { t } = useTranslation();

    if (!show) return null;

    return (
        <div className="mm-modal-overlay">
            <div className="mm-modal-content">
                <h2 className="mm-modal-title">{t("municipalityMandateModal.confirmDeleteTitle")}</h2>

                <p className="mm-modal-message">{t("municipalityMandateModal.confirmDeleteMessage")}</p>
                <p className="mm-modal-mandate-name"><strong>{mandateName}</strong>?</p>

                <div className="mm-modal-actions">
                    <button className="mm-btn mm-btn-danger" onClick={onConfirm}>
                        {t("municipalityMandateModal.deleteButton")}
                    </button>
                    <button className="mm-btn mm-btn-secondary" onClick={onClose}>
                        {t("municipalityMandateModal.cancelButton")}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default MunicipalityMandateConfirmModal;
