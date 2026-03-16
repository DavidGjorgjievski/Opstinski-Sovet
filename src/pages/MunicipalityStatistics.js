import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import api from '../api/axios';
import '../styles/SessionStatistics.css';

function MunicipalityStatistics() {
    const { municipalityId } = useParams();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [sessions, setSessions] = useState([]);
    const [municipalityName, setMunicipalityName] = useState('');
    const [municipalityLogo, setMunicipalityLogo] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get(`/api/municipalities/${municipalityId}`)
            .then(res => {
                setMunicipalityName(res.data.name || '');
                setMunicipalityLogo(res.data.logoImage || null);
            })
            .catch(err => console.error('Failed to load municipality', err));

        api.get(`/api/municipalities/${municipalityId}/statistics`)
            .then(res => setSessions(res.data))
            .catch(err => console.error('Failed to load municipality statistics', err))
            .finally(() => setLoading(false));
    }, [municipalityId]);

    const formatSize = (bytes) => {
        if (!bytes) return '—';
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        const months = t('months', { returnObjects: true });
        const d = new Date(dateStr);
        return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    };

    const totalTopics = sessions.reduce((s, r) => s + r.topicCount, 0);
    const totalWithPdf = sessions.reduce((s, r) => s + r.topicsWithPdf, 0);
    const totalPages = sessions.reduce((s, r) => s + r.totalPages, 0);
    const totalSize = sessions.reduce((s, r) => s + r.totalSizeBytes, 0);

    return (
        <div className="stats-container">
            <HelmetProvider>
                <Helmet>
                    <title>{t('municipalityStatistics.title')}</title>
                </Helmet>
            </HelmetProvider>

            <Header />

            <main className="stats-body">
                <div className="stats-header-wrapper">
                    <button className="back-button" onClick={() => navigate(`/municipalities`)}>
                        <span className="back-icon"><FontAwesomeIcon icon={faChevronLeft} /></span>
                        <span className="back-text">{t('common.back')}</span>
                    </button>
                    <div className="stats-municipality-header">
                        {municipalityLogo && (
                            <img
                                src={`data:image/jpeg;base64,${municipalityLogo}`}
                                alt={municipalityName}
                                className="stats-municipality-logo"
                            />
                        )}
                        <div>
                            <h1 className="stats-title">{t('municipalityStatistics.title')}</h1>
                            {municipalityName && <p className="stats-session-name">{municipalityName}</p>}
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="loading-spinner">
                        <img src={`${process.env.PUBLIC_URL}/images/loading.svg`} alt="Loading..." />
                    </div>
                ) : (
                    <>
                        <div className="stats-summary-row">
                            <div className="stats-summary-card">
                                <span className="stats-summary-value">{sessions.length}</span>
                                <span className="stats-summary-label">{t('municipalityStatistics.totalSessions')}</span>
                            </div>
                            <div className="stats-summary-card">
                                <span className="stats-summary-value">{totalTopics}</span>
                                <span className="stats-summary-label">{t('statistics.totalTopics')}</span>
                            </div>
                            <div className="stats-summary-card">
                                <span className="stats-summary-value">{totalWithPdf}</span>
                                <span className="stats-summary-label">{t('statistics.topicsWithPdf')}</span>
                            </div>
                            <div className="stats-summary-card">
                                <span className="stats-summary-value">{totalPages}</span>
                                <span className="stats-summary-label">{t('statistics.totalPages')}</span>
                            </div>
                            <div className="stats-summary-card">
                                <span className="stats-summary-value">{formatSize(totalSize)}</span>
                                <span className="stats-summary-label">{t('statistics.totalSize')}</span>
                            </div>
                        </div>

                        <div className="stats-table-wrapper">
                            <table className="stats-table">
                                <thead>
                                    <tr>
                                        <th className="stats-th stats-th-num">#</th>
                                        <th className="stats-th">{t('municipalityStatistics.sessionName')}</th>
                                        <th className="stats-th stats-th-center">{t('municipalityStatistics.date')}</th>
                                        <th className="stats-th stats-th-center">{t('statistics.totalTopics')}</th>
                                        <th className="stats-th stats-th-center">{t('statistics.topicsWithPdf')}</th>
                                        <th className="stats-th stats-th-center">{t('statistics.totalPages')}</th>
                                        <th className="stats-th stats-th-center">{t('statistics.totalSize')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sessions.map((session, index) => (
                                        <tr
                                            key={session.sessionId}
                                            className="stats-tr stats-tr-clickable"
                                            onClick={() => navigate(`/municipalities/${municipalityId}/sessions/${session.sessionId}/statistics`)}
                                            title={t('municipalityStatistics.viewSession')}
                                        >
                                            <td className="stats-td stats-td-num">{index + 1}</td>
                                            <td className="stats-td stats-td-title">{session.sessionName}</td>
                                            <td className="stats-td stats-td-center">{formatDate(session.date)}</td>
                                            <td className="stats-td stats-td-center">
                                                <span className="stats-pages-badge">{session.topicCount}</span>
                                            </td>
                                            <td className="stats-td stats-td-center">
                                                <span className="stats-pages-badge">{session.topicsWithPdf}</span>
                                            </td>
                                            <td className="stats-td stats-td-center">
                                                {session.totalPages > 0
                                                    ? <span className="stats-pages-badge">{session.totalPages}</span>
                                                    : '—'}
                                            </td>
                                            <td className="stats-td stats-td-center">
                                                {session.totalSizeBytes > 0
                                                    ? <span className="stats-size-badge">{formatSize(session.totalSizeBytes)}</span>
                                                    : '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </main>

            <Footer />
        </div>
    );
}

export default MunicipalityStatistics;
