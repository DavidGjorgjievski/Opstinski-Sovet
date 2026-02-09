import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import Header from '../components/Header';
import { useTranslation } from 'react-i18next';
import '../styles/AddSessionForm.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare, faPlus, faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import api from '../api/axios';

function AddSessionForm() {
    const { t } = useTranslation();
    const [name, setName] = useState('');
    const [date, setDate] = useState(() => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    });

    const { id } = useParams();
    const { municipalityId } = useParams();
    const navigate = useNavigate();

   useEffect(() => {
        const fetchSession = async () => {
            if (!id) return;

            try {
                const { data } = await api.get(`/api/sessions/${id}`);

                setName(data.name);
                setDate(data.date);

            } catch (error) {
                console.error('Error fetching session:', error);
            }
        };

        fetchSession();
    }, [id]);


   const handleSubmit = async (event) => {
        event.preventDefault();

        const sessionData = !id
            ? { name, date, municipalityId: Number(municipalityId) }
            : { name, date };

        try {
            if (id) {
                // EDIT session
                await api.put(`/api/sessions/edit/${id}`, sessionData);
            } else {
                // ADD session
                await api.post(`/api/sessions/add`, sessionData);
            }

            navigate(`/municipalities/${municipalityId}/sessions`);

        } catch (error) {
            console.error(`Error ${id ? 'editing' : 'adding'} session:`, error);
        }
    };

    const handleBack = () => {
        if (id) {
            navigate(`/municipalities/${municipalityId}/sessions#session-${id}`);
        } else {
            navigate(`/municipalities/${municipalityId}/sessions`);
        }
    };

    return (
        <HelmetProvider>
            <div className="add-session-container">
                <Helmet>
                    <title>{id ? t("addSessionForm.editTitle") : t("addSessionForm.addTitle")}</title>
                </Helmet>
                <Header />

                <div className="add-session-body-container container">
                    <div className="container">
                        <div className="add-session-header-div mt-2">
                            <h1>{id ? t("addSessionForm.editHeader") : t("addSessionForm.addHeader")}</h1>
                        </div>
                        <div className="row justify-content-center">
                            <div>
                                <form onSubmit={handleSubmit}>
                                    <div className="form-group">
                                        <label htmlFor="name" className="label-add">
                                            {t("addSessionForm.sessionNameLabel")}
                                        </label>
                                        { name.includes("\n") || name.length > 50 ? (
                                            <textarea
                                                id="name"
                                                name="name"
                                                className="mb-2 session-textarea-title"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                required
                                                placeholder={t("addSessionForm.sessionNamePlaceholder")}
                                                rows={2}
                                            />
                                        ) : (
                                            <input
                                                type="text"
                                                id="name"
                                                name="name"
                                                className="mb-2 session-input-title"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                required
                                                placeholder={t("addSessionForm.sessionNamePlaceholder")}
                                            />
                                        )}

                                    </div>

                                   <div className="form-group">
                                        <label htmlFor="date" className="label-add">
                                            {t("addSessionForm.sessionDateLabel")}
                                        </label>
                                        <input
                                            type="date"
                                            className="mb-2 session-date-input"
                                            id="date"
                                            name="date"
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div className="mt-3 d-flex">
                                    <button 
                                        type="submit" 
                                        className="me-2 add-form-submit-button"
                                    >
                                        {id ? t("addSessionForm.editButton") : t("addSessionForm.addButton")}
                                        <FontAwesomeIcon 
                                            icon={id ? faPenToSquare : faPlus} 
                                            className="ms-2"
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
                                        {t("addSessionForm.backButton")}
                                    </button>
                                </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </HelmetProvider>
    );
}

export default AddSessionForm;
