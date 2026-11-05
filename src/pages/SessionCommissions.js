import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import '../styles/Topics.css';
import '../styles/Commissions.css';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';
import UserAvatar from '../components/UserAvatar';
import { storeTermImages, isTermPopulated } from '../cache/imageCache';

function SessionCommissions() {
    const { t } = useTranslation();
    const { municipalityId, sessionId } = useParams();
    const navigate = useNavigate();

    const [sessionName, setSessionName] = useState('');
    const [commissions, setCommissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [termId, setTermId] = useState(undefined);

    const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data: session } = await api.get(`/api/sessions/${sessionId}`);
                setSessionName(session.name);
                setTermId(session.municipalityMandateId);

                // Warm the user-image cache for this term so president photos show
                // (avatars re-render on their own once the images are stored)
                if (session.municipalityMandateId && !isTermPopulated(session.municipalityMandateId)) {
                    api.get(`/api/municipality-terms/${session.municipalityMandateId}/user-images`)
                        .then(res => storeTermImages(session.municipalityMandateId, res.data))
                        .catch(() => {});
                }

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
                    <div className="commissions-grid session-commissions-grid">
                        {commissions.map(commission => {
                            const membership = (userInfo.commissionRoles || []).find(cr => cr.commissionId === commission.id);
                            return (
                                <Link
                                    key={commission.id}
                                    to={`/municipalities/${municipalityId}/sessions/${sessionId}/commissions/${commission.id}/topics`}
                                    className={`commission-card commission-card-name-only commission-card-clickable ${membership ? 'commission-card--mine' : ''}`}
                                >
                                    <h3 className="commission-name">{commission.name}</h3>
                                    {commission.presidentUsername && (
                                        <div className="commission-president-chip session-commission-president-chip">
                                            <UserAvatar
                                                username={commission.presidentUsername}
                                                name={commission.presidentName || ''}
                                                surname={commission.presidentSurname || ''}
                                                termId={termId}
                                                className="commission-president-avatar"
                                            />
                                            <div className="commission-president-text">
                                                <span className="commission-president-label">{t('commissions.rolePresident')}</span>
                                                <span className="commission-president-name">
                                                    {commission.presidentName} {commission.presidentSurname}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                    <div className="progress-bar-container">
                                        <div
                                            className="progress-bar-fill"
                                            style={{ width: `${commission.progressPercent}%` }}
                                        ></div>
                                        <span className="progress-text">{commission.progressPercent}%</span>
                                    </div>
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
