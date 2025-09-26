import React from 'react';
import '../styles/MunicipalityConfirmModal.css'
import { useTranslation } from "react-i18next";


function MunicipalityConfirmModal({ show, onClose, onConfirm, municipalityName }) {

    const { t } = useTranslation();
    
    if (!show) {
        return null; 
    }

    return (
        <div className="municipality-modal-overlay">
            <div className="municipality-modal-content">
                <h2>{t("MunicipalityModal.title")}</h2>
                <p>{t("MunicipalityModal.message")}</p>
                <p><strong>{municipalityName}</strong>?</p>
                <div className="municipality-modal-actions">
                <button className="municipality-btn municipality-btn-danger" onClick={onConfirm}>
                    {t("MunicipalityModal.delete")}
                </button>
                <button className="municipality-btn municipality-btn-secondary" onClick={onClose}>
                    {t("MunicipalityModal.cancel")}
                </button>
                </div>
            </div>
        </div>
    );
}

export default MunicipalityConfirmModal;
