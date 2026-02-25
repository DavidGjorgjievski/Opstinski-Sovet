import React, { useEffect, useState } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import Header from '../components/Header';
import { useNavigate, useParams } from 'react-router-dom';
import '../styles/TopicDetails.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faFilter, faFilePdf } from '@fortawesome/free-solid-svg-icons';
import Footer from '../components/Footer';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';

function AmendmentDetails() {
    const navigate = useNavigate();
    const { municipalityId, id, idt, amendmentId } = useParams();
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showVotes, setShowVotes] = useState(false);
    const { t } = useTranslation();

    useEffect(() => {
        const fetchDetails = async () => {
            setLoading(true);
            try {
                const { data } = await api.get(`/api/topics/${idt}/amendments/${amendmentId}/details`);
                setDetails(data);
                setShowVotes(data.status === 'ACTIVE' || data.status === 'FINISHED');
            } catch (error) {
                console.error('Failed to fetch amendment details:', error);
            } finally {
                setLoading(false);
            }
        };

        if (idt && amendmentId) {
            fetchDetails();
        }
    }, [idt, amendmentId]);

    const handlePdfFetch = async (pdfId) => {
        try {
            const response = await api.get(`/api/topics/${idt}/amendments/pdf/${pdfId}`, {
                responseType: 'blob',
                headers: { Accept: 'application/pdf' },
            });
            const url = URL.createObjectURL(response.data);
            window.open(url, '_blank');
            setTimeout(() => URL.revokeObjectURL(url), 10000);
        } catch (error) {
            console.error('Error fetching PDF:', error);
        }
    };

    const handleBackButtonClick = () => {
        sessionStorage.removeItem('scrollPosition');
        navigate(`/municipalities/${municipalityId}/sessions/${id}/topics/amendments/${idt}#amendment-${amendmentId}`);
    };

    return (
        <div className="topic-details-container">
            <HelmetProvider>
                <Helmet>
                    <title>
                        {details && showVotes
                            ? t('topicsDetails.detailedResults')
                            : t('topicsDetails.details')}
                    </title>
                </Helmet>
            </HelmetProvider>
            <Header />
            <main className="topic-details-body-container">
                {loading ? (
                    <div className="loading-spinner">
                        <img src={`${process.env.PUBLIC_URL}/images/loading.svg`} alt="Loading..." />
                    </div>
                ) : (
                    details && (
                        <>
                            <div className="back-button-detailed-results-container">
                                <button onClick={handleBackButtonClick} className="back-button">
                                    <span className="back-icon">
                                        <FontAwesomeIcon icon={faChevronLeft} />
                                    </span>
                                    <span className="back-text">
                                        {t('topicsDetails.backButton')}
                                    </span>
                                </button>
                            </div>
                            <div className="detailed-result-header">
                                <h1 className="topicDetails-header-title">
                                    {showVotes ? t('topicsDetails.detailedResults') : t('topicsDetails.details')}
                                </h1>
                            </div>
                            <div>
                                <p className="detail-title">{details.title}</p>

                                {details.status === 'CREATED' && (
                                    <div>
                                        <p><strong>{t('topicsDetails.notStartedMessage')}</strong></p>
                                    </div>
                                )}

                                {details.pdfFileId != null && (
                                    <div>
                                        <button className="button-pdf" onClick={() => handlePdfFetch(details.pdfFileId)}>
                                            {t('topicsDetails.viewDocument')} <FontAwesomeIcon icon={faFilePdf} />
                                        </button>
                                    </div>
                                )}

                                {showVotes && (
                                    <div className="vote-summary-container">
                                        <div className="vote-summary-grid">
                                            <span className="topic-detail-yes-sum">{t('topicsDetails.yes')}: {details.yesUsers.length}</span>
                                            <span className="topic-detail-no-sum">{t('topicsDetails.no')}: {details.noUsers.length}</span>
                                            <span className="topic-detail-abstained-sum">{t('topicsDetails.abstained')}: {details.abstainedUsers.length}</span>
                                            <span className="topic-detail-cant-vote-sum">{t('topicsDetails.cantVote')}: {details.cantVoteUsers.length}</span>
                                            <span className="topic-detail-havent-vote-sum">{t('topicsDetails.notVoted')}: {details.haventVoteUsers.length}</span>
                                            <span className="topic-detail-absent-sum">{t('topicsDetails.absent')}: {details.absentVoteUsers.length}</span>
                                        </div>
                                    </div>
                                )}

                                {showVotes && (
                                    <div className="table-wrapper">
                                        <table className="details-table">
                                            <thead>
                                                <tr>
                                                    <th className="text-center details-table-th">{t('topicsDetails.image')}</th>
                                                    <th className="text-center details-table-th">{t('topicsDetails.fullName')}</th>
                                                    <th className="text-center details-table-th">{t('topicsDetails.vote')} <FontAwesomeIcon icon={faFilter} /></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {[...(details.yesUsers || [])].map((user, index) => (
                                                    <tr key={`yes-${index}`}>
                                                        <td><img src={`data:image/jpeg;base64,${user.image}`} alt={`${user.name} ${user.surname}`} className="details-image" /></td>
                                                        <td>{user.name} {user.surname}</td>
                                                        <td><span className="topic-detail-yes">{t('topicsDetails.yes')}</span></td>
                                                    </tr>
                                                ))}
                                                {[...(details.noUsers || [])].map((user, index) => (
                                                    <tr key={`no-${index}`}>
                                                        <td><img src={`data:image/jpeg;base64,${user.image}`} alt={`${user.name} ${user.surname}`} className="details-image" /></td>
                                                        <td>{user.name} {user.surname}</td>
                                                        <td><span className="topic-detail-no">{t('topicsDetails.no')}</span></td>
                                                    </tr>
                                                ))}
                                                {[...(details.abstainedUsers || [])].map((user, index) => (
                                                    <tr key={`abstained-${index}`}>
                                                        <td><img src={`data:image/jpeg;base64,${user.image}`} alt={`${user.name} ${user.surname}`} className="details-image" /></td>
                                                        <td>{user.name} {user.surname}</td>
                                                        <td><span className="topic-detail-abstained">{t('topicsDetails.abstained')}</span></td>
                                                    </tr>
                                                ))}
                                                {[...(details.cantVoteUsers || [])].map((user, index) => (
                                                    <tr key={`cantVote-${index}`}>
                                                        <td><img src={`data:image/jpeg;base64,${user.image}`} alt={`${user.name} ${user.surname}`} className="details-image" /></td>
                                                        <td>{user.name} {user.surname}</td>
                                                        <td><span className="topic-detail-cant-vote">{t('topicsDetails.cantVote')}</span></td>
                                                    </tr>
                                                ))}
                                                {[...(details.haventVoteUsers || [])].map((user, index) => (
                                                    <tr key={`notVoted-${index}`}>
                                                        <td><img src={`data:image/jpeg;base64,${user.image}`} alt={`${user.name} ${user.surname}`} className="details-image" /></td>
                                                        <td>{user.name} {user.surname}</td>
                                                        <td><span className="topic-detail-havent-vote">{t('topicsDetails.notVoted')}</span></td>
                                                    </tr>
                                                ))}
                                                {[...(details.absentVoteUsers || [])].map((user, index) => (
                                                    <tr key={`absent-${index}`}>
                                                        <td><img src={`data:image/jpeg;base64,${user.image}`} alt={`${user.name} ${user.surname}`} className="details-image" /></td>
                                                        <td>{user.name} {user.surname}</td>
                                                        <td><span className="topic-detail-absent">{t('topicsDetails.absent')}</span></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </>
                    )
                )}
            </main>
            {!loading && <Footer />}
        </div>
    );
}

export default AmendmentDetails;
