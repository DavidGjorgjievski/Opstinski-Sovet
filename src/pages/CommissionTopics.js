import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import '../styles/Topics.css';
import '../styles/Commissions.css';
import Header from '../components/Header';
import Footer from '../components/Footer';
import RestartTopicStatusModal from '../components/RestartTopicStatusModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faCirclePlay, faCircleStop, faRotateLeft, faSquarePollVertical } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';
import useCommissionVoteWebSocket from '../hooks/useCommissionVoteWebSocket';
import { storeTermImages, isTermPopulated } from '../cache/imageCache';

function CommissionTopics() {
    const { t } = useTranslation();
    const { municipalityId, sessionId, commissionId } = useParams();
    const navigate = useNavigate();
    const selectedLang = localStorage.getItem("selectedLanguage") || "mk";

    const userInfo = useMemo(() => JSON.parse(localStorage.getItem('userInfo')) || {}, []);

    const [commissionTopics, setCommissionTopics] = useState([]);
    const [commissionName, setCommissionName] = useState('');
    const [sessionName, setSessionName] = useState('');
    const [commissionMembers, setCommissionMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentVotes, setCurrentVotes] = useState({});
    const [isRestartModalOpen, setIsRestartModalOpen] = useState(false);
    const [restartTargetId, setRestartTargetId] = useState(null);
    const [restartTargetTitle, setRestartTargetTitle] = useState('');
    const votingInProgressRef = useRef(new Set());

    const { messages: voteMessages, sendCommissionVote } = useCommissionVoteWebSocket(sessionId, commissionId);

    const fetchAll = useCallback(async () => {
        try {
            const [commissionRes, listRes] = await Promise.all([
                api.get(`/api/commissions/${commissionId}`),
                api.get(`/api/sessions/${sessionId}/commissions/${commissionId}/topics`),
            ]);
            setCommissionMembers(commissionRes.data.members || []);
            setCommissionTopics(listRes.data.commissionTopics || []);
            setCommissionName(listRes.data.commissionName || commissionRes.data.name || '');
            setSessionName(listRes.data.sessionName || '');
        } catch (error) {
            console.error('Error fetching commission topics:', error);
        } finally {
            setLoading(false);
        }
    }, [sessionId, commissionId]);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    // Warm the user-image cache for this term so avatars render on the details page too
    useEffect(() => {
        const warmImageCache = async () => {
            const cachedSessions = JSON.parse(localStorage.getItem(`sessions_${municipalityId}`)) || [];
            const cachedSession = cachedSessions.find(s => String(s.id) === String(sessionId));

            let termId = cachedSession?.municipalityMandateId;
            if (!termId) {
                try {
                    const { data } = await api.get(`/api/sessions/${sessionId}`);
                    termId = data.municipalityMandateId;
                } catch (error) {
                    console.error('Error resolving session term:', error);
                    return;
                }
            }

            if (!termId || isTermPopulated(termId)) return;

            api.get(`/api/municipality-terms/${termId}/user-images`)
                .then(res => storeTermImages(termId, res.data))
                .catch(() => {});
        };

        if (municipalityId && sessionId) warmImageCache();
    }, [municipalityId, sessionId]);

    const membership = useMemo(
        () => commissionMembers.find(m => m.username === userInfo.username),
        [commissionMembers, userInfo.username]
    );
    const isMember = !!membership;
    const isCommissionPresident = membership?.role === 'PRESIDENT';

    const canVote = isMember &&
        userInfo.status === 'ACTIVE' &&
        (userInfo.role === 'ROLE_PRESIDENT' || userInfo.role === 'ROLE_USER');

    const canControl = isCommissionPresident || userInfo.role === 'ROLE_ADMIN';

    const currentSession = (JSON.parse(localStorage.getItem(`sessions_${municipalityId}`)) || [])
        .find(s => s.id === parseInt(sessionId));

    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
    const isSessionLocked = userInfo.role !== 'ROLE_ADMIN' &&
        currentSession && new Date(currentSession.date) < twoMonthsAgo;

    useEffect(() => {
        if (!isMember) return;
        api.get(`/api/sessions/${sessionId}/commissions/${commissionId}/commission-topics-user-votes`)
            .then(({ data }) => {
                const votesMap = {};
                data.forEach(([commissionTopicId, voteStatus]) => {
                    votesMap[commissionTopicId] = voteStatus;
                });
                setCurrentVotes(votesMap);
            })
            .catch(error => console.error('Error fetching commission topic user votes:', error));
    }, [isMember, sessionId, commissionId]);

    useEffect(() => {
        if (voteMessages.length === 0) return;
        const lastResult = voteMessages.at(-1);
        const updatedId = lastResult.commissionTopicId;

        setCommissionTopics((prev) =>
            prev.map((ct) =>
                ct.id === updatedId
                    ? {
                        ...ct,
                        yes: lastResult.yes,
                        no: lastResult.no,
                        abstained: lastResult.abstained,
                        cantVote: lastResult.cantVote,
                        haveNotVoted: lastResult.haveNotVoted,
                        absent: lastResult.absent,
                        status: lastResult.status,
                    }
                    : ct
            )
        );

        if (canVote && lastResult.voterUsername === userInfo.username && lastResult.voteType) {
            setCurrentVotes((prev) => ({ ...prev, [updatedId]: lastResult.voteType }));
        }

        if (canVote && lastResult.status === 'CREATED') {
            setCurrentVotes((prev) => ({ ...prev, [updatedId]: 'HAVE_NOT_VOTED' }));
        }
    }, [voteMessages, canVote, userInfo.username]);

    const startVoting = async (commissionTopicId) => {
        try {
            await api.get(`/api/commission-topics/${commissionTopicId}/active`);
            await fetchAll();
            sendCommissionVote(commissionTopicId);
        } catch (error) {
            console.error('Error starting commission voting:', error);
        }
    };

    const finishVoting = async (commissionTopicId) => {
        try {
            await api.get(`/api/commission-topics/${commissionTopicId}/finish`);
            await fetchAll();
            sendCommissionVote(commissionTopicId);
        } catch (error) {
            console.error('Error finishing commission voting:', error);
        }
    };

    const openRestartModal = (commissionTopicId, title) => {
        setRestartTargetId(commissionTopicId);
        setRestartTargetTitle(title);
        setIsRestartModalOpen(true);
    };

    const closeRestartModal = () => {
        setIsRestartModalOpen(false);
        setRestartTargetId(null);
    };

    const handleRestartConfirm = async () => {
        const commissionTopicId = restartTargetId;
        closeRestartModal();
        if (!commissionTopicId) return;

        try {
            await api.get(`/api/commission-topics/${commissionTopicId}/restart`);
            setCurrentVotes((prev) => {
                const updated = { ...prev };
                delete updated[commissionTopicId];
                return updated;
            });
            await fetchAll();
            sendCommissionVote(commissionTopicId);
        } catch (error) {
            console.error('Error restarting commission voting:', error);
        }
    };

    const handleVote = async (commissionTopicId, voteType) => {
        if (currentVotes[commissionTopicId] === voteType) return;
        if (votingInProgressRef.current.has(commissionTopicId)) return;
        votingInProgressRef.current.add(commissionTopicId);

        const prevVoteType = currentVotes[commissionTopicId];

        try {
            await api.post(`/api/commission-topics/vote/${commissionTopicId}/${voteType}`);

            setCurrentVotes((prev) => ({ ...prev, [commissionTopicId]: voteType }));

            const voteFieldMap = {
                YES: 'yes',
                NO: 'no',
                ABSTAINED: 'abstained',
                CANNOT_VOTE: 'cantVote',
                HAVE_NOT_VOTED: 'haveNotVoted',
            };
            setCommissionTopics((prev) =>
                prev.map((ct) => {
                    if (ct.id !== commissionTopicId) return ct;
                    const updated = { ...ct };
                    const newField = voteFieldMap[voteType];
                    const prevField = voteFieldMap[prevVoteType];
                    if (newField) updated[newField] = (updated[newField] || 0) + 1;
                    if (prevField) updated[prevField] = Math.max(0, (updated[prevField] || 0) - 1);
                    return updated;
                })
            );

            sendCommissionVote(commissionTopicId, voteType, userInfo.username);
        } catch (error) {
            console.error('Error submitting commission vote:', error);
        } finally {
            votingInProgressRef.current.delete(commissionTopicId);
        }
    };

    const getTitleFontSize = (title) => {
        const len = title?.length || 0;
        if (len > 90) return '1.3rem';
        if (len > 60) return '1.5rem';
        if (len > 35) return '1.8rem';
        return null; // use CSS default
    };

    return (
        <div className="commissions-container">
            <HelmetProvider>
                <Helmet><title>{t('commissions.title')}</title></Helmet>
            </HelmetProvider>
            <Header />

            <main className="topcis-container-body">
                <div className='d-flex justify-content-center'>
                    <div className="topic-header">
                        <div className='topic-header-title-div'>
                            <button
                                className="back-button"
                                onClick={() => navigate(`/municipalities/${municipalityId}/sessions/${sessionId}/commissions`)}
                            >
                                <span className="back-icon">
                                    <FontAwesomeIcon icon={faChevronLeft} />
                                </span>
                                <span className="back-text">{t('common.back')}</span>
                            </button>
                            <h1
                                className="commission-topics-title"
                                style={getTitleFontSize(commissionName) ? { fontSize: getTitleFontSize(commissionName) } : undefined}
                            >
                                {commissionName}
                            </h1>
                            {sessionName && <h6 className='session-title'>{sessionName}</h6>}
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="loading-spinner">
                        <img src={`${process.env.PUBLIC_URL}/images/loading.svg`} alt="Loading..." />
                    </div>
                ) : commissionTopics.length === 0 ? (
                    <p className="commissions-empty-state">{t('commissions.noCommissionTopics')}</p>
                ) : (
                    <div className="topic-body">
                        {commissionTopics.map((ct) => (
                            <div key={ct.id} className='topic-div-rel'>
                                <div className={`topic-item ${ct.status === 'FINISHED' ? 'finished-topic' : ''} topic-item-size`}>
                                    <div className="topic-header-div">
                                        <h3 className="text-center">
                                            <span className="topic-header-text ape-width">{ct.title}</span>
                                        </h3>
                                    </div>

                                    {ct.amount && (
                                        <div className="topic-pill-container">
                                            <div className="topic-amount-container">
                                                {ct.amount} {t('topicsPage.currency')}
                                            </div>
                                        </div>
                                    )}

                                    <div className='topic-item-body'>
                                        {(ct.status === 'ACTIVE' || ct.status === 'FINISHED') && (
                                            <div className={`topic-item-body-detail ${
                                                ct.status === 'ACTIVE' ? 'topic-item-body-detail-active' : 'topic-item-body-detail-finish'
                                            }`}>
                                                <div className="topic-item-body-detail-group">
                                                    <div className="topic-item-body-detail-group-chunk">
                                                        <div className="rez-container">
                                                            <span className="text-for-rez">{t("topicsPage.yes")}</span>
                                                        </div>
                                                        <div
                                                            onClick={canVote && ct.status === 'ACTIVE' ? () => handleVote(ct.id, 'YES') : undefined}
                                                            className={[
                                                                'topic-button-vote', 'vote-yes',
                                                                currentVotes[ct.id] === 'YES' && canVote ? 'active-vote' : '',
                                                                ct.status === 'ACTIVE' && canVote ? 'vote-activated vote-hover-enabled' : '',
                                                                ct.status === 'FINISHED' ? 'vote-yes-finished' : '',
                                                            ].join(' ')}
                                                        >
                                                            {ct.yes}
                                                        </div>
                                                    </div>
                                                    <div className="topic-item-body-detail-group-chunk">
                                                        <div className="rez-container">
                                                            <span className="text-for-rez">{t("topicsPage.no")}</span>
                                                        </div>
                                                        <div
                                                            onClick={canVote && ct.status === 'ACTIVE' ? () => handleVote(ct.id, 'NO') : undefined}
                                                            className={[
                                                                'topic-button-vote', 'vote-no',
                                                                currentVotes[ct.id] === 'NO' && canVote ? 'active-vote' : '',
                                                                ct.status === 'ACTIVE' && canVote ? 'vote-activated vote-hover-enabled' : '',
                                                                ct.status === 'FINISHED' ? 'vote-no-finished' : '',
                                                            ].join(' ')}
                                                        >
                                                            {ct.no}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="topic-item-body-detail-group">
                                                    <div className="topic-item-body-detail-group-chunk">
                                                        <div className="rez-container">
                                                            <span className="text-for-rez">{t("topicsPage.abstained")}</span>
                                                        </div>
                                                        <div
                                                            onClick={canVote && ct.status === 'ACTIVE' ? () => handleVote(ct.id, 'ABSTAINED') : undefined}
                                                            className={[
                                                                'topic-button-vote', 'vote-abstained',
                                                                currentVotes[ct.id] === 'ABSTAINED' && canVote ? 'active-vote' : '',
                                                                ct.status === 'ACTIVE' && canVote ? 'vote-activated vote-hover-enabled' : '',
                                                                ct.status === 'FINISHED' ? 'vote-abstained-finished' : '',
                                                            ].join(' ')}
                                                        >
                                                            {ct.abstained}
                                                        </div>
                                                    </div>
                                                    <div className="topic-item-body-detail-group-chunk">
                                                        <div className="rez-container">
                                                            <span className="text-for-rez">{t("topicsPage.cantVote")}</span>
                                                        </div>
                                                        <div
                                                            onClick={canVote && ct.status === 'ACTIVE' ? () => handleVote(ct.id, 'CANNOT_VOTE') : undefined}
                                                            className={[
                                                                'topic-button-vote', 'vote-cantvote',
                                                                currentVotes[ct.id] === 'CANNOT_VOTE' && canVote ? 'active-vote' : '',
                                                                ct.status === 'ACTIVE' && canVote ? 'vote-activated vote-hover-enabled' : '',
                                                                ct.status === 'FINISHED' ? 'vote-cantvote-finished' : '',
                                                            ].join(' ')}
                                                        >
                                                            {ct.cantVote}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="topic-item-body-detail-group">
                                                    <div className="topic-item-body-detail-group-chunk">
                                                        <div className="rez-container">
                                                            <span className="text-for-rez">{t("topicsPage.notVoted")}</span>
                                                        </div>
                                                        <div
                                                            onClick={canVote && ct.status === 'ACTIVE' ? () => handleVote(ct.id, 'HAVE_NOT_VOTED') : undefined}
                                                            className={[
                                                                'topic-button-vote', 'vote-haventvote',
                                                                currentVotes[ct.id] === 'HAVE_NOT_VOTED' && canVote ? 'active-vote' : '',
                                                                ct.status === 'ACTIVE' && canVote ? 'vote-activated vote-hover-enabled' : '',
                                                                ct.status === 'FINISHED' ? 'vote-haventvote-finished' : '',
                                                            ].join(' ')}
                                                        >
                                                            {ct.haveNotVoted}
                                                        </div>
                                                    </div>
                                                    <div className="topic-item-body-detail-group-chunk">
                                                        <div className="rez-container">
                                                            <span className="text-for-rez">{t("topicsPage.absent")}</span>
                                                        </div>
                                                        <div className="topic-button-vote vote-absent">{ct.absent}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="topic-item-body-detail-footer">
                                            <div className="topic-item-body-detail-group-footer">
                                                <div className="command-buttons">
                                                    <Link
                                                        to={`/municipalities/${municipalityId}/sessions/${sessionId}/commissions/${commissionId}/topics/details/${ct.id}`}
                                                        className={`gold-button ${selectedLang}`}
                                                    >
                                                        {ct.status === "CREATED"
                                                            ? t("topicsPage.details")
                                                            : t("topicsPage.detailedResults")}&nbsp;
                                                        <FontAwesomeIcon icon={faSquarePollVertical} />
                                                    </Link>
                                                </div>

                                                {canControl && !isSessionLocked && (
                                                    <div className="command-buttons-group">
                                                        {ct.status === 'CREATED' && (
                                                            <div className="command-buttons">
                                                                <button
                                                                    onClick={() => startVoting(ct.id)}
                                                                    className={`change-topic-status-button ${selectedLang}`}
                                                                >
                                                                    {t("topicsPage.startVoting")} <FontAwesomeIcon icon={faCirclePlay} />
                                                                </button>
                                                            </div>
                                                        )}
                                                        {ct.status === 'ACTIVE' && (
                                                            <div className="command-buttons">
                                                                <button
                                                                    onClick={() => finishVoting(ct.id)}
                                                                    className={`change-topic-status-button ${selectedLang}`}
                                                                >
                                                                    {t("topicsPage.finishVoting")} <FontAwesomeIcon icon={faCircleStop} />
                                                                </button>
                                                            </div>
                                                        )}
                                                        {ct.status === 'FINISHED' && (
                                                            <div className="command-buttons">
                                                                <button
                                                                    onClick={() => openRestartModal(ct.id, ct.title)}
                                                                    className={`change-topic-status-button ${selectedLang}`}
                                                                >
                                                                    {t("topicsPage.restartVoting")} <FontAwesomeIcon icon={faRotateLeft} />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {!loading && <Footer />}

            {isRestartModalOpen && (
                <RestartTopicStatusModal
                    isOpen={isRestartModalOpen}
                    onClose={closeRestartModal}
                    topicTitle={restartTargetTitle}
                    onConfirm={handleRestartConfirm}
                />
            )}
        </div>
    );
}

export default CommissionTopics;
