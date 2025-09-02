import React, { useEffect, useState } from 'react';
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

    const [userData, setUserData] = useState(() => {
        const storedUserInfo = localStorage.getItem('userInfo');
        return storedUserInfo ? JSON.parse(storedUserInfo) : {};
    });

    useEffect(() => {
        const imageData = localStorage.getItem('image');
        if (imageData) {
            setUserData(prevData => ({ ...prevData, image: imageData }));
        }

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
                    <title>{t('homeTitle')}</title>
                </Helmet>
            </HelmetProvider>
            <Header userInfo={userData} />
            <div className="main-content">
                <main>
                    <div className="introduction">
                        <div className="introduction-header text-center my-3">
                            <h1 className="display-4 fw-bold">
                                {t('homeWelcome')}
                            </h1>
                        </div>
                        <div className="introduction-body">
                            <p className="lead">
                                {t('homeDescription')}
                            </p>
                        </div>
                        <div className="d-flex justify-content-center">
                            <Link to="/municipalities">
                                <button className="municipality-nav-button">
                                    {t('municipalitiesButton')} <FontAwesomeIcon icon={faBuildingColumns} />
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
