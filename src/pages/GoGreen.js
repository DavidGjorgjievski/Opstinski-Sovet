import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLeaf, faCloud, faDroplet, faTree, faChevronLeft, faFileLines } from '@fortawesome/free-solid-svg-icons';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';
import '../styles/GoGreen.css';

function useCountUp(target, duration = 1500) {
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

function GoGreen() {
    const { t } = useTranslation();
    const { municipalityId } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get(`/api/municipalities/${municipalityId}/gogreen`)
            .then(res => setData(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [municipalityId]);

    const trees = useCountUp(data ? Math.round(data.treesSaved * 100) / 100 : 0);
    const co2 = useCountUp(data ? Math.round(data.co2SavedKg) : 0);
    const water = useCountUp(data ? Math.round(data.waterSavedLiters) : 0);
    const pagesPrinted = useCountUp(data ? data.totalPagesPrinted : 0);

    return (
        <div className="gogreen-container">
            <HelmetProvider>
                <Helmet><title>{t('goGreen.title')}</title></Helmet>
            </HelmetProvider>
            <Header />
            <main className="gogreen-container-body">
                <div className="gogreen-hero">
                  <div className="gogreen-hero-inner">
                    <button className="back-button" onClick={() => navigate('/municipalities')}>
                        <span className="back-icon"><FontAwesomeIcon icon={faChevronLeft} /></span>
                        <span className="back-text">{t('common.back')}</span>
                    </button>
                    <div className="gogreen-hero-content">
                        <div className="gogreen-badge">
                            <FontAwesomeIcon icon={faLeaf} /> {t('goGreen.badge')}
                        </div>
                        <h1 className="gogreen-session-name">{data ? data.municipalityName : ''}</h1>
                        <p className="gogreen-subtitle">{t('goGreen.subtitle')}</p>
                    </div>
                  </div>
                </div>

                <div className="gogreen-content">
                {loading ? (
                    <div className="gogreen-loading">
                        <div className="gogreen-spinner"></div>
                    </div>
                ) : (<>
                    {/* Main impact cards */}
                    <div className="gogreen-impact-grid">
                        <div className="gogreen-impact-card trees">
                            <div className="gogreen-impact-icon">
                                <FontAwesomeIcon icon={faTree} />
                            </div>
                            <div className="gogreen-impact-number">{trees.toLocaleString()}</div>
                            <div className="gogreen-impact-label">{t('goGreen.treesSaved')}</div>
                            <div className="gogreen-impact-fact">{t('goGreen.treesFact')}</div>
                        </div>
                        <div className="gogreen-impact-card co2">
                            <div className="gogreen-impact-icon">
                                <FontAwesomeIcon icon={faCloud} />
                            </div>
                            <div className="gogreen-impact-number">{co2.toLocaleString()} <span className="gogreen-unit">kg</span></div>
                            <div className="gogreen-impact-label">{t('goGreen.co2Saved')}</div>
                            <div className="gogreen-impact-fact">{t('goGreen.co2Fact')}</div>
                        </div>
                        <div className="gogreen-impact-card water">
                            <div className="gogreen-impact-icon">
                                <FontAwesomeIcon icon={faDroplet} />
                            </div>
                            <div className="gogreen-impact-number">{water.toLocaleString()} <span className="gogreen-unit">L</span></div>
                            <div className="gogreen-impact-label">{t('goGreen.waterSaved')}</div>
                            <div className="gogreen-impact-fact">{t('goGreen.waterFact')}</div>
                        </div>
                        <div className="gogreen-impact-card pages">
                            <div className="gogreen-impact-icon">
                                <FontAwesomeIcon icon={faFileLines} />
                            </div>
                            <div className="gogreen-impact-number">{pagesPrinted.toLocaleString()}</div>
                            <div className="gogreen-impact-label">{t('goGreen.pagesPrinted')}</div>
                            <div className="gogreen-impact-fact">{t('goGreen.pagesFact')}</div>
                        </div>
                    </div>

                    {/* Session breakdown */}
                    <div className="gogreen-table-section">
                        <h2 className="gogreen-table-title">{t('goGreen.sessionBreakdown')}</h2>
                        <div className="gogreen-table-wrapper">
                            <table className="gogreen-table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>{t('goGreen.sessionTitle')}</th>
                                        <th>{t('goGreen.pages')}</th>
                                        <th>{t('goGreen.pagesSaved')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.sessions.map((session, idx) => (
                                        <tr key={idx} className={session.totalPages ? '' : 'gogreen-no-pdf'}>
                                            <td>{idx + 1}</td>
                                            <td>{session.name}</td>
                                            <td>{session.totalPages || '—'}</td>
                                            <td>{session.totalPages ? session.pagesPrinted.toLocaleString() : '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>)}
                </div>
            </main>
            <Footer />
        </div>
    );
}

export default GoGreen;
