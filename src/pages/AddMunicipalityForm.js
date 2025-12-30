import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import Header from '../components/Header';
import '../styles/AddMunicipalityForm.css';
import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare, faPlus, faChevronLeft, faImage } from '@fortawesome/free-solid-svg-icons';
import api from '../api/axios'; // Axios instance

function AddMunicipalityForm() {
    const { id } = useParams(); // For edit mode
    const [name, setName] = useState('');
    const [logo, setLogo] = useState(null);
    const [flag, setFlag] = useState(null);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const isEditMode = !!id;
    const { t } = useTranslation();

    useEffect(() => {
        if (isEditMode) {
            const fetchMunicipality = async () => {
                try {
                    const response = await api.get(`/api/municipalities/${id}`);
                    const data = response.data;
                    setName(data.name || '');
                    // Optionally, handle existing logo/flag preview if needed
                } catch (err) {
                    console.error('Error fetching municipality:', err);
                    setError('Имаше грешка при вчитување на општината.');
                }
            };
            fetchMunicipality();
        }
    }, [id, isEditMode]);

    const handleNameChange = (e) => setName(e.target.value);
    const handleLogoChange = (e) => setLogo(e.target.files[0]);
    const handleFlagChange = (e) => setFlag(e.target.files[0]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!name.trim()) {
            setError('Името на општината е задолжително!');
            return;
        }
        if (!logo && !isEditMode) {
            setError('Изборот на лого е задолжителен!');
            return;
        }

        setError('');

        const formData = new FormData();
        formData.append('name', name);
        if (logo) formData.append('logo', logo);
        if (flag) formData.append('flag', flag);

        try {
            const url = isEditMode ? `/api/municipalities/${id}` : '/api/municipalities';
            const method = isEditMode ? 'put' : 'post';
            const response = await api({
                method,
                url,
                data: formData,
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            const updatedMunicipality = response.data;

            // Update local cache
            const cachedMunicipalities = JSON.parse(localStorage.getItem('municipalities')) || [];
            if (isEditMode) {
                const updatedList = cachedMunicipalities.map(m =>
                    m.id === updatedMunicipality.id ? updatedMunicipality : m
                );
                localStorage.setItem('municipalities', JSON.stringify(updatedList));
            } else {
                cachedMunicipalities.push(updatedMunicipality);
                localStorage.setItem('municipalities', JSON.stringify(cachedMunicipalities));
            }

            navigate('/municipalities');
        } catch (err) {
            console.error('Error submitting municipality form:', err);
            setError('Имаше грешка при обработка на општината.');
        }
    };

    return (
        <HelmetProvider>
            <div className="add-municipality-container">
                <Helmet>
                    <title>{isEditMode ? t("addMunicipality.pageTitleEdit") : t("addMunicipality.pageTitleAdd")}</title>
                </Helmet>
                <Header />

                <div className="add-municipality-body-container">
                    <div className="add-municipality-header-div mt-2">
                        <h1>{isEditMode ? t("addMunicipality.headerEdit") : t("addMunicipality.headerAdd")}</h1>
                    </div>

                    {error && <div className="error-message alert alert-danger">{error}</div>}

                    <div className="row justify-content-center">
                        <div>
                            <form onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label htmlFor="name" className="label-add">{t("addMunicipality.nameLabel")}</label>
                                    <input
                                        type="text"
                                        className="mb-2 municipality-input-name"
                                        id="name"
                                        value={name}
                                        onChange={handleNameChange}
                                        required
                                        placeholder={t("addMunicipality.namePlaceholder")}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="label-add">{t("addMunicipality.logoLabel")}</label>
                                    <div className="image-upload-wrapper">
                                        <label className={`image-upload-button-preview ${logo ? 'has-file' : ''}`}>
                                            {logo ? (
                                                <img src={URL.createObjectURL(logo)} alt="Logo Preview" />
                                            ) : (
                                                <FontAwesomeIcon icon={faImage} className="placeholder-icon" />
                                            )}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleLogoChange}
                                                className="hidden-file-input"
                                            />
                                        </label>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="label-add">{t("addMunicipality.flagImageLabel")}</label>
                                    <div className="image-upload-wrapper">
                                        <label className={`image-upload-button-preview ${flag ? 'has-file' : ''}`}>
                                            {flag ? (
                                                <img src={URL.createObjectURL(flag)} alt="Flag Preview" />
                                            ) : (
                                                <FontAwesomeIcon icon={faImage} className="placeholder-icon" />
                                            )}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFlagChange}
                                                className="hidden-file-input"
                                            />
                                        </label>
                                    </div>
                                </div>

                                <div className="mt-3 d-flex">
                                    <button type="submit" className="me-2 municipality-form-add-button">
                                        {isEditMode ? t("addMunicipality.submitEdit") : t("addMunicipality.submitAdd")}
                                        <FontAwesomeIcon icon={isEditMode ? faPenToSquare : faPlus} className="ms-2" />
                                    </button>
                                    <button
                                        type="button"
                                        className="municipality-form-back-button-topic"
                                        onClick={() => navigate('/municipalities')}
                                    >
                                        <FontAwesomeIcon icon={faChevronLeft} className="me-2" />
                                        {t("addMunicipality.back")}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </HelmetProvider>
    );
}

export default AddMunicipalityForm;
