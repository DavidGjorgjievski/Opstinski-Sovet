import React, { useEffect } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import '../styles/Home.css';
import Header from '../components/Header';
import { initializeMobileMenu } from '../components/mobileMenu';
import Footer from '../components/Footer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBuildingColumns } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

function Home() {
    const { t } = useTranslation();


    useEffect(() => {
        const cleanupMobileMenu = initializeMobileMenu();

        sessionStorage.removeItem('scrollPosition');

        return () => {
            cleanupMobileMenu();
        };
    }, []);

    return (
        <div className="home-container">
            <HelmetProvider>
                <Helmet>
                    <title>{t('home.title')}</title>
                </Helmet>
            </HelmetProvider>
            <Header/>
            <div className="main-content">
                <main>
                    <div className="introduction">
                        <div className="introduction-header text-center my-3">
                            <h1 className="display-4 fw-bold">
                                {t('home.welcome')}
                            </h1>
                        </div>
                        <div className="introduction-body">
                            <p className="lead">
                                {t('home.description')}
                            </p>
                        </div>
                        <div className="d-flex justify-content-center">
                            <Link to="/municipalities">
                                <button className="municipality-nav-button">
                                    {t('home.municipalitiesButton')} <FontAwesomeIcon icon={faBuildingColumns} />
                                </button>
                            </Link>
                        </div>
                    </div>
                </main>
            </div>
            <Footer />
        </div>
    );
}

export default Home;
