import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import Header from '../components/Header';
import { initializeMobileMenu } from '../components/mobileMenu';
import '../styles/AddFormMandate.css';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare, faPlus, faChevronLeft } from '@fortawesome/free-solid-svg-icons';

function AddFormMandate() {
    const [userData, setUserData] = useState(() => {
        const storedUserInfo = localStorage.getItem('userInfo');
        return storedUserInfo ? JSON.parse(storedUserInfo) : {};
    });

    const { t } = useTranslation();
    const { id } = useParams(); // edit mode
    const navigate = useNavigate();

    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const isEditMode = Boolean(id);

    useEffect(() => {
        const imageData = localStorage.getItem('image');
        if (imageData) {
            setUserData(prevData => ({ ...prevData, image: imageData }));
        }

        // Initialize mobile menu only if elements exist
        let cleanupMobileMenu = () => {};
        if (document.getElementById('mobile-menu-toggle') && document.getElementById('mobile-nav')) {
            cleanupMobileMenu = initializeMobileMenu();
        }

        if (isEditMode) {
            const fetchMandate = async () => {
                setLoading(true);
                try {
                    const token = localStorage.getItem('jwtToken');
                    const response = await fetch(
                        `${process.env.REACT_APP_API_URL}/api/terms/${id}`,
                        {
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        }
                    );
                    if (!response.ok) throw new Error('Failed to fetch mandate');
                    const mandate = await response.json();
                    setStartDate(mandate.startDate);
                    setEndDate(mandate.endDate);
                } catch (err) {
                    console.error(err);
                    setMessage(t('addMandate.errorFetch'));
                } finally {
                    setLoading(false);
                }
            };
            fetchMandate();
        } else {
            // Default dates for new term
            const today = new Date();
            const fourYearsLater = new Date();
            fourYearsLater.setFullYear(today.getFullYear() + 4);

            setStartDate(today.toISOString().split('T')[0]);
            setEndDate(fourYearsLater.toISOString().split('T')[0]);
        }

        return () => cleanupMobileMenu();
    }, [id, isEditMode, t]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('jwtToken');
        const url = isEditMode
            ? `${process.env.REACT_APP_API_URL}/api/terms/edit/${id}`
            : `${process.env.REACT_APP_API_URL}/api/terms/create`;
        const method = isEditMode ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ startDate, endDate }),
            });

            if (response.ok) {
                // Redirect immediately to /mandate on success
                navigate('/mandate');
            } else {
                // Keep error message visible
                const errorText = await response.text();
                setMessage(errorText || t('addMandate.error'));
            }
        } catch (error) {
            console.error(error);
            setMessage(t('addMandate.error'));
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <img src={`${process.env.PUBLIC_URL}/images/loading.svg`} alt="Loading..." />
            </div>
        );
    }

    return (
        <HelmetProvider>
            <div className="add-mandate-page">
                <Helmet>
                    <title>
                        {isEditMode ? t('addMandate.editTitle') : t('addMandate.title')}
                    </title>
                </Helmet>

                <Header userInfo={userData} isSticky={true} />

                <div className="add-mandate-container">
                    <div className="add-mandate-body-container">
                        <div className="add-mandate-header-div mt-2">
                            <h1>
                                {isEditMode ? t('addMandate.editTitle') : t('addMandate.title')}
                            </h1>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label htmlFor="startDate" className="label-add">
                                    {t('addMandate.startDate')}
                                </label>
                                <input
                                    type="date"
                                    id="startDate"
                                    className="mandate-date-input"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="endDate" className="label-add">
                                    {t('addMandate.endDate')}
                                </label>
                                <input
                                    type="date"
                                    id="endDate"
                                    className="mandate-date-input"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="mt-3 d-flex">
                                 <button 
                                    type="submit" 
                                    className="me-2 mandate-form-submit-button"
                                >
                                    {isEditMode ? t('addMandate.updateButton') : t('addMandate.submit')}
                                    <FontAwesomeIcon 
                                        icon={isEditMode ? faPenToSquare : faPlus} 
                                        className="ms-2"
                                    />
                                </button>

                                <button
                                    type="button"
                                    className="mandate-form-back-button"
                                    onClick={() => navigate('/mandate')}
                                >
                                    <FontAwesomeIcon 
                                        icon={faChevronLeft} 
                                        className="me-2"
                                    />
                                    {t('addMandate.back')}
                                </button>
                            </div>
                        </form>

                        {message && <p className="mandate-message">{message}</p>}
                    </div>
                </div>
            </div>
        </HelmetProvider>
    );
}

export default AddFormMandate;
