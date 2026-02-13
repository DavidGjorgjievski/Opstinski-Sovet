import React, { useEffect } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import '../styles/Amendments.css';
import Header from '../components/Header';
import { useTranslation } from 'react-i18next';

import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';

function Amendments() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    useEffect(() => {
        sessionStorage.removeItem('scrollPosition');
    }, []);

    return (
        <div className="amendments-container">
            <HelmetProvider>
                <Helmet>
                    <title>{t('amendments.title')}</title>
                </Helmet>
            </HelmetProvider>

            <Header />

            <div className="amendments-body-container">

                <div className="d-flex justify-content-start mt-2">
                    <button
                        className="back-button"
                        onClick={() => navigate(-1)}
                    >
                        <span className="back-icon">
                            <FontAwesomeIcon icon={faChevronLeft} />
                        </span>
                        <span className="back-text">
                            {t("topicsPage.backButton")}
                        </span>
                    </button>
                </div>
                <main className="d-flex flex-column justify-content-center align-items-center text-center" style={{ minHeight: "60vh" }}>
                    <h2 className="fw-bold mb-3">
                        Страницата за Амандмани е во изработка
                    </h2>
                    <p className="lead">
                        Функционалноста за управување со амандмани е во фаза на развој.
                    </p>
                </main>
            </div>

        </div>
    );
}

export default Amendments;
