import React, { useEffect, useState, useCallback } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import Header from '../components/Header';
import { initializeMobileMenu } from '../components/mobileMenu';
import '../styles/AddMunicipalityMandateForm.css';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faPlus, faImage, faPenToSquare } from '@fortawesome/free-solid-svg-icons';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';

function AddMunicipalityMandateForm() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { id, mandateId } = useParams(); 
    const isEditMode = Boolean(mandateId);
    const [mandate, setMandate] = useState('');
    const [municipality, setMunicipality] = useState('');
    const [termImage, setTermImage] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [error, setError] = useState('');

    const formatDateByLanguage = useCallback((dateString) => {
        const date = new Date(dateString);
        if (isNaN(date)) return '';
        const months = t('months', { returnObjects: true });
        return `${months[date.getMonth()]} ${date.getFullYear()}`;
    }, [t]);

    // Load municipality
    useEffect(() => {
        const municipalities = JSON.parse(localStorage.getItem('municipalities')) || [];
        const current = municipalities.find(m => m.id === Number(id));
        if (current) setMunicipality(current.name);
        else setError(t('AddMunicipalityMandate.errorFetchingMunicipality'));
    }, [id, t]);

    // Load term info + image if edit mode
    useEffect(() => {
        const mandatesData = JSON.parse(localStorage.getItem('mandates')) || [];
        if (mandatesData.length > 0) {
            const newestMandate = mandatesData.reduce((latest, current) =>
                new Date(current.startDate) > new Date(latest.startDate) ? current : latest
            );

            setMandate(
                `${formatDateByLanguage(newestMandate.startDate)} → ${formatDateByLanguage(newestMandate.endDate)}`
            );
        }

        if (isEditMode) {
            const termList = JSON.parse(localStorage.getItem('municipalityTerms')) || [];
            const existingTerm = termList.find(m => m.id === Number(mandateId));

            if (existingTerm?.imageUrl) {
                setPreviewImage(existingTerm.imageUrl);
            }
        }
    }, [formatDateByLanguage, isEditMode, mandateId, t]);

    // Mobile Menu Init
    useEffect(() => {
        const cleanupMobileMenu = initializeMobileMenu();
        return () => cleanupMobileMenu();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!mandate.trim() || !municipality.trim()) {
            setError(t('AddMunicipalityMandate.errorFieldsRequired'));
            return;
        }

        if (!isEditMode && !termImage) {
            setError(t('AddMunicipalityMandate.errorImageRequired'));
            return;
        }

        try {
            setError('');
            const token = localStorage.getItem('jwtToken');
            const formData = new FormData();

            if (!isEditMode) {
                const mandatesData = JSON.parse(localStorage.getItem('mandates')) || [];
                const newestMandate = mandatesData.reduce((latest, current) =>
                    new Date(current.startDate) > new Date(latest.startDate) ? current : latest
                );
                
                formData.append("municipalityId", id);
                formData.append("termId", newestMandate.id);
            }

            if (termImage) {
                formData.append("termImage", termImage);
            }

            const url = isEditMode
                ? `/api/municipality-terms/update/${mandateId}`
                : `/api/municipality-terms/create`;

            await api({
                method: isEditMode ? "put" : "post",
                url,
                data: formData,
                headers: { Authorization: `Bearer ${token}` },
            });

            // Refresh from backend after saving
            const updatedTermsResponse = await api.get(`/api/municipality-terms/municipality/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            localStorage.setItem('municipalityTerms', JSON.stringify(updatedTermsResponse.data));

            navigate(`/municipalities/${id}/mandates`);
        } catch (err) {
            console.error(err);
            setError(t('AddMunicipalityMandate.errorSubmit'));
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        setTermImage(file);
        if (file) setPreviewImage(URL.createObjectURL(file));
    };

    return (
        <HelmetProvider>
            <div className="add-municipality-mandate-container">
                <Helmet>
                    <title>
                        {isEditMode ? t('AddMunicipalityMandate.editTitle') : t('AddMunicipalityMandate.title')}
                    </title>
                </Helmet>

                <Header />

                <div className="add-municipality-mandate-body-container">
                    <div className="add-municipality-mandate-header-div mt-2">
                        <h1>
                            {isEditMode ? t('AddMunicipalityMandate.editTitle') : t('AddMunicipalityMandate.title')}
                        </h1>
                    </div>

                    {error && <div className="alert alert-danger error-message">{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="label-add">{t('AddMunicipalityMandate.mandateLabel')}</label>
                            <input className="municipality-input-name" value={mandate} disabled />
                        </div>

                        <div className="form-group">
                            <label className="label-add">{t('AddMunicipalityMandate.municipalityLabel')}</label>
                            <input className="municipality-input-name" value={municipality} disabled />
                        </div>

                        <div className="image-upload-wrapper">
                            <label className={`image-upload-button-preview ${previewImage ? 'has-file' : ''}`}>
                                {previewImage
                                    ? <img src={previewImage} alt="Preview" />
                                    : <FontAwesomeIcon icon={faImage} className="placeholder-icon" />
                                }
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="hidden-file-input"
                                />
                            </label>
                        </div>

                        <div className="mt-3 d-flex form-buttons-wrapper">
                            <button type="submit" className="me-2 municipality-form-add-button">
                                {isEditMode ? t('AddMunicipalityMandate.saveButton') : t('AddMunicipalityMandate.submitButton')}
                                <FontAwesomeIcon icon={isEditMode ? faPenToSquare : faPlus} className="ms-2" />
                            </button>

                            <button
                                type="button"
                                className="municipality-form-back-button-topic"
                                onClick={() => navigate(`/municipalities/${id}/mandates`)}
                            >
                                <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
                                {t('AddMunicipalityMandate.backButton')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </HelmetProvider>
    );
}

export default AddMunicipalityMandateForm;
