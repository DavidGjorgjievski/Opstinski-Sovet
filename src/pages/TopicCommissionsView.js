import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faSquarePollVertical } from '@fortawesome/free-solid-svg-icons';
import api from '../api/axios';
import '../styles/Topics.css';
import '../styles/Commissions.css';

const TopicCommissionsView = () => {
    const { id, idt, municipalityId } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const selectedLang = localStorage.getItem('selectedLanguage') || 'mk';

    const [topicTitle, setTopicTitle] = useState('');
    const [commissions, setCommissions] = useState([]);
    const [loading, setLoading] = useState(true);

    const calculateProgress = () => {
        if (!commissions || commissions.length === 0) return 0;
        const finishedCount = commissions.filter(
            (commission) => commission.status === 'FINISHED'
        ).length;
        return Math.min((finishedCount / commissions.length) * 100, 100);
    };

    useEffect(() => {
        document.body.classList.add('commission-topics-bg');
        return () => document.body.classList.remove('commission-topics-bg');
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [topicRes, commissionsRes] = await Promise.all([
                    api.get(`/api/topics/details/${idt}`),
                    api.get(`/api/topics/${idt}/commissions`),
                ]);
                setTopicTitle(topicRes.data.title);
                setCommissions(commissionsRes.data);
            } catch (error) {
                console.error('Error fetching topic commissions:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id, idt]);

    return (
        <div className="topics-container">
            <HelmetProvider>
                <Helmet>
                    <title>{t('topicCommissionsView.pageTitle')}</title>
                </Helmet>
            </HelmetProvider>
            <Header />
            <main className="topcis-container-body">
                <div className="d-flex justify-content-center">
                    <div className="topic-header">
                        <div className="topic-header-title-div">
                            <button
                                className="back-button"
                                onClick={() => navigate(`/municipalities/${municipalityId}/sessions/${id}/topics#topic-${idt}`)}
                            >
                                <span className="back-icon">
                                    <FontAwesomeIcon icon={faChevronLeft} />
                                </span>
                                <span className="back-text">{t('common.back')}</span>
                            </button>
                            <h1 className="topic-header-title mb-2">{t('topicCommissionsView.header')}</h1>

                            {commissions.length > 0 && (
                                <div className="progress-bar-container">
                                    <div
                                        className="progress-bar-fill"
                                        style={{ width: `${calculateProgress()}%` }}
                                    ></div>
                                    <span className="progress-text">{Math.round(calculateProgress())}%</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {topicTitle && (
                    <div className="commission-topic-subtitle-wrapper">
                        <h5 className="commission-topic-subtitle">{topicTitle}</h5>
                    </div>
                )}

                {loading ? (
                    <div className="loading-spinner">
                        <img src={`${process.env.PUBLIC_URL}/images/loading.svg`} alt="Loading..." />
                    </div>
                ) : commissions.length === 0 ? (
                    <p className="commissions-empty-state">{t('topicCommissionsView.noCommissions')}</p>
                ) : (
                    <div className="topic-body">
                        <div className="topic-div-rel">
                            <div className="topic-item topic-item-size commission-groups-wrapper">
                                {commissions.map(commission => (
                                    <div
                                        key={commission.commissionId}
                                        className={`topic-commission-group ${commission.status === 'FINISHED' ? 'finished-topic' : ''}`}
                                    >
                                        <h4 className="topic-commission-group-name">
                                            {commission.commissionName}
                                        </h4>

                                        {(commission.status === 'ACTIVE' || commission.status === 'FINISHED') && (
                                            <div className={`topic-item-body-detail ${
                                                commission.status === 'ACTIVE'
                                                    ? 'topic-item-body-detail-active'
                                                    : 'topic-item-body-detail-finish'
                                            }`}>
                                                <div className="topic-item-body-detail-group">
                                                    <div className="topic-item-body-detail-group-chunk">
                                                        <div className="rez-container">
                                                            <span className="text-for-rez">{t('topicsPage.yes')}</span>
                                                        </div>
                                                        <div className={`topic-button-vote vote-yes ${commission.status === 'FINISHED' ? 'vote-yes-finished' : ''}`}>
                                                            {commission.yes}
                                                        </div>
                                                    </div>
                                                    <div className="topic-item-body-detail-group-chunk">
                                                        <div className="rez-container">
                                                            <span className="text-for-rez">{t('topicsPage.no')}</span>
                                                        </div>
                                                        <div className={`topic-button-vote vote-no ${commission.status === 'FINISHED' ? 'vote-no-finished' : ''}`}>
                                                            {commission.no}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="topic-item-body-detail-group">
                                                    <div className="topic-item-body-detail-group-chunk">
                                                        <div className="rez-container">
                                                            <span className="text-for-rez">{t('topicsPage.abstained')}</span>
                                                        </div>
                                                        <div className={`topic-button-vote vote-abstained ${commission.status === 'FINISHED' ? 'vote-abstained-finished' : ''}`}>
                                                            {commission.abstained}
                                                        </div>
                                                    </div>
                                                    <div className="topic-item-body-detail-group-chunk">
                                                        <div className="rez-container">
                                                            <span className="text-for-rez">{t('topicsPage.cantVote')}</span>
                                                        </div>
                                                        <div className={`topic-button-vote vote-cantvote ${commission.status === 'FINISHED' ? 'vote-cantvote-finished' : ''}`}>
                                                            {commission.cantVote}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="topic-item-body-detail-group">
                                                    <div className="topic-item-body-detail-group-chunk">
                                                        <div className="rez-container">
                                                            <span className="text-for-rez">{t('topicsPage.notVoted')}</span>
                                                        </div>
                                                        <div className={`topic-button-vote vote-haventvote ${commission.status === 'FINISHED' ? 'vote-haventvote-finished' : ''}`}>
                                                            {commission.haveNotVoted}
                                                        </div>
                                                    </div>
                                                    <div className="topic-item-body-detail-group-chunk">
                                                        <div className="rez-container">
                                                            <span className="text-for-rez">{t('topicsPage.absent')}</span>
                                                        </div>
                                                        <div className="topic-button-vote vote-absent">
                                                            {commission.absent}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="topic-item-body-detail-footer">
                                            <div className="topic-item-body-detail-group-footer">
                                                <div className="command-buttons">
                                                    <Link
                                                        to={`/municipalities/${municipalityId}/sessions/${id}/commissions/${commission.commissionId}/topics/details/${commission.commissionTopicId}`}
                                                        className={`gold-button ${selectedLang}`}
                                                    >
                                                        {commission.status === 'CREATED'
                                                            ? t('topicsPage.details')
                                                            : t('topicsPage.detailedResults')}&nbsp;
                                                        <FontAwesomeIcon icon={faSquarePollVertical} />
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {!loading && <Footer />}
        </div>
    );
};

export default TopicCommissionsView;
