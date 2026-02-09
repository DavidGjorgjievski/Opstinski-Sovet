import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import Header from '../components/Header';
import { useTranslation } from 'react-i18next';
import '../styles/AddBiographyForm.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare, faPlus, faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import api from '../api/axios';

function AddBiographyForm({ mode }) {
    const { t } = useTranslation();
    const [biography, setBiography] = useState('');
    const navigate = useNavigate();

    // Fetch biography in edit mode
    useEffect(() => {
        if (mode === 'edit') {
            api.get('/api/users/biography')
                .then(res => setBiography(res.data || ''))
                .catch(err => console.error(err));
        }
    }, [mode]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            await api.post(
                '/api/users/biography',
                biography,
                { headers: { 'Content-Type': 'text/plain' } }
            );

            const storedUser = JSON.parse(localStorage.getItem('userInfo'));
            if (storedUser) {
                storedUser.biography = biography;
                localStorage.setItem('userInfo', JSON.stringify(storedUser));
            }

            navigate('/profile');
        } catch (err) {
            console.error(err);
        }
    };

    const handleBack = () => {
        navigate('/profile');
    };

    return (
        <HelmetProvider>
            <div className="add-biography-container">
                <Helmet>
                    <title>{t(`addBiographyForm.${mode}.title`)}</title>
                </Helmet>

                <Header />

                <div className="add-biography-body-container container">
                    <div className="add-biography-header-div mt-2">
                        <h1>{t(`addBiographyForm.${mode}.title`)}</h1>
                    </div>

                    <div className="row justify-content-center">
                        <div>
                            <form onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <textarea
                                        id="biography"
                                        name="biography"
                                        className="biography-textarea"
                                        value={biography}
                                        onChange={(e) => setBiography(e.target.value)}
                                        placeholder={t(`addBiographyForm.${mode}.biographyPlaceholder`)}
                                        rows={8}
                                        maxLength={500}
                                        required
                                    />
                                </div>

                                <div className="mt-3 d-flex">
                                    <button
                                        type="submit"
                                        className="add-form-submit-button me-2"
                                    >
                                        {t(`addBiographyForm.${mode}.saveButton`)}
                                        <FontAwesomeIcon
                                            icon={mode === 'edit' ? faPenToSquare : faPlus}
                                            className="me-2"
                                        />
                                    </button>

                                    <button
                                        type="button"
                                        className="add-form-back-button"
                                        onClick={handleBack}
                                    >
                                        <span className="back-icon">
                                            <FontAwesomeIcon icon={faChevronLeft} />
                                        </span>
                                        {t(`addBiographyForm.${mode}.backButton`)}
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

export default AddBiographyForm;
