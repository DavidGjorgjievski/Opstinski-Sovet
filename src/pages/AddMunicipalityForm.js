import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom'; // Import useParams for route parameters
import { Helmet, HelmetProvider } from 'react-helmet-async'; // Helmet for metadata
import Header from '../components/Header';
import { initializeMobileMenu } from '../components/mobileMenu';
import '../styles/AddMunicipalityForm.css';
import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare, faPlus, faChevronLeft, faImage } from '@fortawesome/free-solid-svg-icons';

function AddMunicipalityForm() {
    const { id } = useParams(); // Get the ID from the route parameters
    const [name, setName] = useState('');
    const [logo, setLogo] = useState(null);
    const [sessionImage, setSessionImage] = useState(null); // State for session image
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};
    const isEditMode = !!id; // Check if in edit mode
    const { t } = useTranslation();

    useEffect(() => {
        if (isEditMode) {
            // Fetch existing municipality data to populate the form for editing
            const fetchMunicipality = async () => {
                try {
                    const token = localStorage.getItem('jwtToken');
                    const response = await fetch(`${process.env.REACT_APP_API_URL}/api/municipalities/${id}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                        },
                    });
                    if (!response.ok) {
                        throw new Error('Failed to fetch municipality data');
                    }
                    const data = await response.json();
                    setName(data.name || '');
                    // Optionally, handle existing logo display if needed
                } catch (error) {
                    console.error('Error fetching municipality data:', error);
                }
            };
            fetchMunicipality();
        }
    }, [id, isEditMode]);

    const handleNameChange = (e) => setName(e.target.value);
    const handleLogoChange = (e) => setLogo(e.target.files[0]);
    const handleSessionImageChange = (e) => setSessionImage(e.target.files[0]); // Update session image state

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
        if (logo) {
            formData.append('logo', logo);
        }
        if (sessionImage) {
            formData.append('sessionImage', sessionImage); // Append session image
        }

        try {
            const token = localStorage.getItem('jwtToken');
            const url = isEditMode
                ? `${process.env.REACT_APP_API_URL}/api/municipalities/${id}`
                : `${process.env.REACT_APP_API_URL}/api/municipalities`;
            const method = isEditMode ? 'PUT' : 'POST';
            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            if (!response.ok) {
                throw new Error(isEditMode ? 'Failed to edit municipality' : 'Failed to add municipality');
            }

            // After success, update the cache
            const updatedMunicipality = await response.json();
            const cachedMunicipalities = JSON.parse(localStorage.getItem('municipalities')) || [];
            
            if (isEditMode) {
                // If editing, update the specific municipality in cache
                const updatedMunicipalities = cachedMunicipalities.map((municipality) =>
                    municipality.id === updatedMunicipality.id ? updatedMunicipality : municipality
                );
                localStorage.setItem('municipalities', JSON.stringify(updatedMunicipalities));
            } else {
                // If adding, add the new municipality to cache
                cachedMunicipalities.push(updatedMunicipality);
                localStorage.setItem('municipalities', JSON.stringify(cachedMunicipalities));
            }

            navigate('/municipalities');
        } catch (error) {
            console.error('Error submitting municipality form:', error);
            setError('Имаше грешка при обработка на општината.');
        }
    };

    useEffect(() => {
        const cleanupMobileMenu = initializeMobileMenu();
        return () => cleanupMobileMenu();
    }, []);

    return (
        <HelmetProvider>
            <div className="add-municipality-container">
                <Helmet>
                    {isEditMode ? t("addMunicipality.pageTitleEdit") : t("addMunicipality.pageTitleAdd")}
                </Helmet>
                <Header userInfo={userInfo} />

                <div className="add-municipality-body-container">
                    <div className="add-municipality-header-div mt-2">
                        <h1>
                            {isEditMode ? t("addMunicipality.headerEdit") : t("addMunicipality.headerAdd")}
                        </h1>
                    </div>

                    {error && <div className="error-message alert alert-danger">{error}</div>}

                    <div className="row justify-content-center">
                        <div>
                            <form onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label htmlFor="name" className="label-add">{t("addMunicipality.nameLabel")}</label>
                                    <input
                                        type="text"
                                        className="form-control form-control-lg mb-2"
                                        id="name"
                                        name="name"
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
    <label className="label-add">{t("addMunicipality.sessionImageLabel")}</label>
    <div className="image-upload-wrapper">
        <label className={`image-upload-button-preview ${sessionImage ? 'has-file' : ''}`}>
    {sessionImage ? (
        <img src={URL.createObjectURL(sessionImage)} alt="Session Preview" />
    ) : (
        <FontAwesomeIcon icon={faImage} className="placeholder-icon" />
    )}
    <input
        type="file"
        accept="image/*"
        onChange={handleSessionImageChange}
        className="hidden-file-input"
    />
</label>
    </div>
</div>



                                <div className="mt-3 d-flex">
                                   <button
                                        type="submit"
                                        className="me-2 municipality-form-add-button"
                                    >
                                        {isEditMode ? t("addMunicipality.submitEdit") : t("addMunicipality.submitAdd")}
                                       <FontAwesomeIcon 
                                            icon={isEditMode ? faPenToSquare : faPlus} 
                                            className="ms-2"
                                        />
                                    </button>
                                    <button
                                        type="button"
                                        className="municipality-form-back-button-topic"
                                        onClick={() => navigate('/municipalities')}
                                    >
                                        <FontAwesomeIcon 
                                            icon={faChevronLeft} 
                                            className="me-2"
                                        />
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
