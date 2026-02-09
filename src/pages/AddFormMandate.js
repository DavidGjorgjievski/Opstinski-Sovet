import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import Header from '../components/Header';
import '../styles/AddFormMandate.css';
import '../styles/Main.css';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare, faPlus, faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import api from '../api/axios'; 

function AddFormMandate() {
   
    const { t } = useTranslation();
    const { id } = useParams(); // edit mode
    const navigate = useNavigate();

    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const isEditMode = Boolean(id);

    useEffect(() => {
        if (isEditMode) {
            const fetchMandate = async () => {
                setLoading(true);
                try {
                    const token = localStorage.getItem('jwtToken');
                    const response = await api.get(`/api/terms/${id}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    const mandate = response.data;
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
            const today = new Date();
            const fourYearsLater = new Date();
            fourYearsLater.setFullYear(today.getFullYear() + 4);
            setStartDate(today.toISOString().split('T')[0]);
            setEndDate(fourYearsLater.toISOString().split('T')[0]);
        }

    }, [id, isEditMode, t]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('jwtToken');

        const payload = { startDate, endDate };

        try {
            const url = isEditMode ? `/api/terms/edit/${id}` : `/api/terms/create`;
            const method = isEditMode ? 'put' : 'post';

            await api({
                method,
                url,
                data: payload,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            navigate('/mandate');
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

                <Header isSticky={true} />

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
                                    className="me-2 add-form-submit-button"
                                >
                                    {isEditMode ? t('addMandate.updateButton') : t('addMandate.submit')}
                                    <FontAwesomeIcon 
                                        icon={isEditMode ? faPenToSquare : faPlus} 
                                        className="ms-2"
                                    />
                                </button>

                               <button
                                    type="button"
                                    className="add-form-back-button"
                                    onClick={() => navigate('/mandate')}
                                >
                                    <span className="back-icon">
                                        <FontAwesomeIcon icon={faChevronLeft} />
                                    </span>
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
