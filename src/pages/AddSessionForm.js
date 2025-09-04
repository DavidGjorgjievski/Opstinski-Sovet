import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import Header from '../components/Header';
import { initializeMobileMenu } from '../components/mobileMenu';
import { useTranslation } from 'react-i18next';
import '../styles/AddSessionForm.css';

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
    const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};

    useEffect(() => {
        const fetchSession = async () => {
            if (id) {
                const jwtToken = localStorage.getItem('jwtToken');
                try {
                    const response = await fetch(`${process.env.REACT_APP_API_URL}/api/sessions/${id}`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${jwtToken}`,
                        },
                    });

                    if (!response.ok) {
                        throw new Error('Failed to fetch session');
                    }

                    const sessionData = await response.json();
                    setName(sessionData.name);
                    setDate(sessionData.date);
                } catch (error) {
                    console.error('Error fetching session:', error);
                }
            }
        };

        fetchSession();
    }, [id]);

    const handleSubmit = async (event) => {
        event.preventDefault();

        const sessionData = !id
            ? { name, date, municipalityId: Number(municipalityId) }
            : { name, date };

        const jwtToken = localStorage.getItem('jwtToken');

        try {
            const url = id
                ? `${process.env.REACT_APP_API_URL}/api/sessions/edit/${id}`
                : `${process.env.REACT_APP_API_URL}/api/sessions/add`;

            const method = id ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${jwtToken}`,
                },
                body: JSON.stringify(sessionData),
            });

            if (!response.ok) {
                throw new Error(`Failed to ${id ? 'edit' : 'add'} session`);
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

    useEffect(() => {
        const cleanupMobileMenu = initializeMobileMenu();
        return () => {
            cleanupMobileMenu();
        };
    }, []);

    return (
        <HelmetProvider>
            <div className="add-session-container">
                <Helmet>
                    <title>{id ? t("addSessionForm.editTitle") : t("addSessionForm.addTitle")}</title>
                </Helmet>
                <Header userInfo={userInfo} />

                <div className="add-session-body-container container">
                    <div className="container">
                        <div className="add-session-header-div mt-2">
                            <h1>{id ? t("addSessionForm.editHeader") : t("addSessionForm.addHeader")}</h1>
                        </div>
                        <div className="row justify-content-center">
                            <div className="col-md-6">
                                <form onSubmit={handleSubmit}>
                                    <div className="form-group">
                                        <label htmlFor="name" className="label-add">
                                            {t("addSessionForm.sessionNameLabel")}
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control form-control-lg mb-2"
                                            id="name"
                                            name="name"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required
                                            placeholder={t("addSessionForm.sessionNamePlaceholder")}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="date" className="label-add">
                                            {t("addSessionForm.sessionDateLabel")}
                                        </label>
                                        <input
                                            type="date"
                                            className="form-control form-control-lg mb-2"
                                            id="date"
                                            name="date"
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div className="mt-3 d-flex">
                                        <button type="submit" className={`btn ${id ? 'btn-warning' : 'btn-primary'} btn-lg me-2`}>
                                            {id ? t("addSessionForm.editButton") : t("addSessionForm.addButton")}
                                        </button>
                                        <button type="button" className="btn btn-danger btn-lg" onClick={handleBack}>
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
