import React, { useEffect, useState } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import '../styles/Home.css';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBuildingColumns,
    faLeaf,
    faTree,
    faCloud,
    faDroplet,
    faFileLines,
    faArrowsRotate
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

function useCountUp(target, duration = 1800) {
    const [count, setCount] = useState(0);
    useEffect(() => {
        if (target === 0) { setCount(0); return; }
        const steps = 60;
        const increment = target / steps;
        const interval = duration / steps;
        let current = 0;
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                setCount(target);
                clearInterval(timer);
            } else {
                setCount(Math.floor(current));
            }
        }, interval);
        return () => clearInterval(timer);
    }, [target, duration]);
    return count;
}

function Home() {
    const { t } = useTranslation();
    const { role } = useAuth();
    const [greenStats, setGreenStats] = useState(null);
    const [greenLoading, setGreenLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        sessionStorage.removeItem('scrollPosition');
        api.get('/api/gogreen/stats')
            .then(res => setGreenStats(res.data))
            .catch(e => console.error('Failed to load green stats:', e))
            .finally(() => setGreenLoading(false));
    }, []);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            const res = await api.post('/api/gogreen/refresh');
            setGreenStats(res.data);
        } catch (e) {
            console.error('Failed to refresh green stats:', e);
        } finally {
            setIsRefreshing(false);
        }
    };

    const trees = useCountUp(greenStats ? Math.round(greenStats.treesSaved * 100) / 100 : 0);
    const co2   = useCountUp(greenStats ? Math.round(greenStats.co2SavedKg) : 0);
    const water = useCountUp(greenStats ? Math.round(greenStats.waterSavedLiters) : 0);
    const pages = useCountUp(greenStats ? greenStats.totalPagesPrinted : 0);

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

                        <div className="scroll-hint">
                            <span className="scroll-hint-dot"></span>
                            <span className="scroll-hint-dot"></span>
                            <span className="scroll-hint-dot"></span>
                        </div>
                    </div>
                </main>

                <section className="home-green-section">
                    <div className="home-green-inner">

                        {/* Header block */}
                        <div className="home-green-header">
                            <div
                                className={`home-green-badge${role === 'ROLE_ADMIN' ? ' home-green-badge--admin' : ''}`}
                                onClick={role === 'ROLE_ADMIN' ? handleRefresh : undefined}
                                title={role === 'ROLE_ADMIN' ? t('homeGoGreen.refresh') : undefined}
                            >
                                <FontAwesomeIcon icon={isRefreshing ? faArrowsRotate : faLeaf} spin={isRefreshing} />
                                {isRefreshing ? t('homeGoGreen.updating') : t('homeGoGreen.badge')}
                            </div>
                            <h2 className="home-green-title">{t('homeGoGreen.title')}</h2>
                            <p className="home-green-subtitle">
                                {t('homeGoGreen.subtitle')}
                            </p>
                        </div>

                        {/* Stat cards */}
                        {greenLoading ? (
                            <div className="home-green-loading">
                                <div className="home-green-spinner"></div>
                            </div>
                        ) : (
                            <div className="home-green-grid">
                                <div className="home-green-card trees">
                                    <div className="home-green-card-icon">
                                        <FontAwesomeIcon icon={faTree} />
                                    </div>
                                    <div className="home-green-card-number">{trees.toLocaleString()}</div>
                                    <div className="home-green-card-label">{t('goGreen.treesSaved')}</div>
                                    <div className="home-green-card-fact">{t('goGreen.treesFact')}</div>
                                </div>
                                <div className="home-green-card co2">
                                    <div className="home-green-card-icon">
                                        <FontAwesomeIcon icon={faCloud} />
                                    </div>
                                    <div className="home-green-card-number">
                                        {co2.toLocaleString()} <span className="home-green-card-unit">kg</span>
                                    </div>
                                    <div className="home-green-card-label">{t('goGreen.co2Saved')}</div>
                                    <div className="home-green-card-fact">{t('goGreen.co2Fact')}</div>
                                </div>
                                <div className="home-green-card water">
                                    <div className="home-green-card-icon">
                                        <FontAwesomeIcon icon={faDroplet} />
                                    </div>
                                    <div className="home-green-card-number">
                                        {water.toLocaleString()} <span className="home-green-card-unit">L</span>
                                    </div>
                                    <div className="home-green-card-label">{t('goGreen.waterSaved')}</div>
                                    <div className="home-green-card-fact">{t('goGreen.waterFact')}</div>
                                </div>
                                <div className="home-green-card pages">
                                    <div className="home-green-card-icon">
                                        <FontAwesomeIcon icon={faFileLines} />
                                    </div>
                                    <div className="home-green-card-number">{pages.toLocaleString()}</div>
                                    <div className="home-green-card-label">{t('goGreen.pagesPrinted')}</div>
                                    <div className="home-green-card-fact">{t('goGreen.pagesFact')}</div>
                                </div>
                            </div>
                        )}

                    </div>
                </section>
            </div>
            <Footer />
        </div>
    );
}

export default Home;
