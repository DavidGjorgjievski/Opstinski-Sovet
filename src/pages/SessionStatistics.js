import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faFilePdf, faFileCircleXmark } from '@fortawesome/free-solid-svg-icons';
import api from '../api/axios';
import '../styles/SessionStatistics.css';

function SessionStatistics() {
    const { municipalityId, sessionId } = useParams();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [topics, setTopics] = useState([]);
    const [sessionName, setSessionName] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const cached = JSON.parse(localStorage.getItem(`sessions_${municipalityId}`) || '[]');
        const session = cached.find(s => String(s.id) === String(sessionId));
        if (session) setSessionName(session.name);

        api.get(`/api/sessions/${sessionId}/statistics`)
            .then(res => setTopics(res.data))
            .catch(err => console.error('Failed to load statistics', err))
            .finally(() => setLoading(false));
    }, [municipalityId, sessionId]);

    const formatSize = (bytes) => {
        if (bytes == null) return '—';
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    const topicsWithPdf = topics.filter(t => t.pdfFileName != null && t.pdfFileName !== '');

    const handlePdfView = async (pdfFileId) => {
        try {
            const response = await api.get(`/api/topics/pdf/${pdfFileId}`, {
                responseType: 'blob',
                headers: { Accept: 'application/pdf' },
            });
            const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            window.open(url, '_blank');
        } catch (err) {
            console.error('Error fetching PDF:', err);
        }
    };
    const totalSize = topics.reduce((sum, t) => sum + (t.pdfSizeBytes || 0), 0);
    const totalPages = topics.reduce((sum, t) => sum + (t.pdfPageCount || 0), 0);

    return (
        <div className="stats-container">
            <HelmetProvider>
                <Helmet>
                    <title>{t('statistics.title')}</title>
                </Helmet>
            </HelmetProvider>

            <Header />

            <main className="stats-body">
                <div className="stats-header-wrapper">
                    <button className="back-button" onClick={() => navigate(`/municipalities/${municipalityId}/sessions`)}>
                        <span className="back-icon"><FontAwesomeIcon icon={faChevronLeft} /></span>
                        <span className="back-text">{t('common.back')}</span>
                    </button>
                    <h1 className="stats-title">{t('statistics.title')}</h1>
                    {sessionName && <p className="stats-session-name">{sessionName}</p>}
                </div>

                {loading ? (
                    <div className="loading-spinner">
                        <img src={`${process.env.PUBLIC_URL}/images/loading.svg`} alt="Loading..." />
                    </div>
                ) : (
                    <>
                        <div className="stats-summary-row">
                            <div className="stats-summary-card">
                                <span className="stats-summary-value">{topics.length}</span>
                                <span className="stats-summary-label">{t('statistics.totalTopics')}</span>
                            </div>
                            <div className="stats-summary-card">
                                <span className="stats-summary-value">{topicsWithPdf.length}</span>
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
                                        <th className="stats-th">{t('statistics.topicTitle')}</th>
                                        <th className="stats-th stats-th-center stats-th-pdf">{t('statistics.pdf')}</th>
                                        <th className="stats-th stats-th-center">{t('statistics.pages')}</th>
                                        <th className="stats-th stats-th-center">{t('statistics.size')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {topics.map((topic, index) => (
                                        <tr key={topic.topicId} className="stats-tr">
                                            <td className="stats-td stats-td-num">{index + 1}</td>
                                            <td className="stats-td stats-td-title">{topic.title}</td>
                                            <td className="stats-td stats-td-center">
                                                {topic.pdfFileName ? (
                                                    <span className="stats-pdf-badge stats-pdf-clickable" onClick={() => handlePdfView(topic.pdfFileId)}>
                                                        <FontAwesomeIcon icon={faFilePdf} className="stats-pdf-icon" />
                                                        {topic.pdfFileName}
                                                    </span>
                                                ) : (
                                                    <FontAwesomeIcon icon={faFileCircleXmark} className="stats-no-pdf-icon" title={t('statistics.noPdf')} />
                                                )}
                                            </td>
                                            <td className="stats-td stats-td-center">
                                                {topic.pdfPageCount != null ? (
                                                    <span className="stats-pages-badge">{topic.pdfPageCount}</span>
                                                ) : '—'}
                                            </td>
                                            <td className="stats-td stats-td-center">
                                                {topic.pdfSizeBytes != null ? (
                                                    <span className="stats-size-badge">{formatSize(topic.pdfSizeBytes)}</span>
                                                ) : '—'}
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

export default SessionStatistics;
