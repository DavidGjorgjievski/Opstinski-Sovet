import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import '../styles/Commissions.css';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';

function SessionCommissions() {
    const { t } = useTranslation();
    const { municipalityId, sessionId } = useParams();
    const navigate = useNavigate();

    const [sessionName, setSessionName] = useState('');
    const [commissions, setCommissions] = useState([]);
    const [loading, setLoading] = useState(true);

    const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data: session } = await api.get(`/api/sessions/${sessionId}`);
                setSessionName(session.name);

                const { data: commissionsData } = await api.get(
                    `/api/sessions/${sessionId}/commissions-with-topics`
                );
                setCommissions(commissionsData);
            } catch (error) {
                console.error('Error fetching session commissions:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [sessionId]);

    return (
        <div className="commissions-container">
            <HelmetProvider>
                <Helmet><title>{t('commissions.title')}</title></Helmet>
            </HelmetProvider>
            <Header />

            <main className="commissions-body">
                <div className="commissions-header">
                    <button className="back-button" onClick={() => navigate(`/municipalities/${municipalityId}/sessions`)}>
                        <span className="back-icon"><FontAwesomeIcon icon={faChevronLeft} /></span>
                        <span className="back-text">{t('common.back')}</span>
                    </button>
                    <h1 className="commissions-title">{t('commissions.title')}</h1>
                    {sessionName && (
                        <p className="commissions-subtitle">{t('commissions.subtitleSession', { name: sessionName })}</p>
                    )}
                </div>

                {loading ? (
                    <div className="loading-spinner">
                        <img src={`${process.env.PUBLIC_URL}/images/loading.svg`} alt="Loading..." />
                    </div>
                ) : commissions.length === 0 ? (
                    <p className="commissions-empty-state">{t('commissions.noCommissionsWithTopics')}</p>
                ) : (
                    <div className="commissions-grid">
                        {commissions.map(commission => {
                            const membership = (commission.members || []).find(m => m.username === userInfo.username);
                            return (
                                <Link
                                    key={commission.id}
                                    to={`/municipalities/${municipalityId}/sessions/${sessionId}/commissions/${commission.id}/topics`}
                                    className={`commission-card commission-card-name-only commission-card-clickable ${membership ? 'commission-card--mine' : ''}`}
                                >
                                    <h3 className="commission-name">{commission.name}</h3>
                                    {membership && (
                                        <span className={`commission-role-badge ${membership.role === 'PRESIDENT' ? 'badge-president' : 'badge-member'}`}>
                                            {membership.role === 'PRESIDENT' ? t('commissions.rolePresident') : t('commissions.roleMember')}
                                        </span>
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                )}
            </main>

            {!loading && <Footer />}
        </div>
    );
}

export default SessionCommissions;
