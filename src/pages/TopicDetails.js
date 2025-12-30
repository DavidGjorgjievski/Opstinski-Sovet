import React, { useEffect, useState } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import Header from '../components/Header';
import { useNavigate, useParams } from 'react-router-dom';
import '../styles/TopicDetails.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'; 
import { faChevronLeft, faFilter, faFilePdf } from '@fortawesome/free-solid-svg-icons';
import Footer from '../components/Footer';
import { useTranslation } from "react-i18next";
import api from '../api/axios';

function TopicDetails() {
    const navigate = useNavigate();
    const { id, idt } = useParams();
    const { municipalityId } = useParams();
    const [topicDetails, setTopicDetails] = useState(null);
    const [loading, setLoading] = useState(true); // Add loading state
    const [showVotes, setShowVotes] = useState(null);
    const { t } = useTranslation();

    useEffect(() => {
        const fetchTopicDetails = async () => {
            setLoading(true);

            try {
                const { data } = await api.get(`/api/topics/details/${idt}`);

                setTopicDetails(data);

                const shouldShowVotes =
                    data.status === "ACTIVE" || data.status === "FINISHED";
                setShowVotes(shouldShowVotes);

            } catch (error) {
                console.error("Failed to fetch topic details:", error);
            } finally {
                setLoading(false);
            }
        };

        if (idt) {
            fetchTopicDetails();
        }
    }, [idt]);

    const handlePdfFetch = async (pdfId) => {
        try {
            const response = await api.get(`/api/topics/pdf/${pdfId}`, {
            responseType: "blob",
            headers: {
                Accept: "application/pdf",
            },
            });

            const url = URL.createObjectURL(response.data);
            window.open(url, "_blank");

            // Prevent memory leaks
            setTimeout(() => URL.revokeObjectURL(url), 10000);
        } catch (error) {
            console.error("Error fetching PDF:", error);
        }
    };

    const handleBackButtonClick = () => {
        // Remove the scroll position from sessionStorage
        sessionStorage.removeItem('scrollPosition');
        console.log("Scroll position removed");

        // Navigate to the desired URL
        navigate(`/municipalities/${municipalityId}/sessions/${id}/topics#topic-${idt}`);
    };

    return (
        <div className="topic-details-container">
            <HelmetProvider>
                <Helmet>
                    <title>
                    {topicDetails && (topicDetails.status === 'ACTIVE' || topicDetails.status === 'FINISHED')
                        ? t("topicsDetails.detailedResults")
                        : t("topicsDetails.details")}
                    </title>
                </Helmet>
            </HelmetProvider>
            <Header />
            <main className='topic-details-body-container'>
                {loading ? ( 
                    <div className="loading-spinner">
                        <img src={`${process.env.PUBLIC_URL}/images/loading.svg`} alt="Loading..." />
                    </div>
                ) : (
                    topicDetails && (
                    <>
                        <div className='back-button-detailed-results-container'>
                            <button onClick={handleBackButtonClick} className="back-button">
                                <FontAwesomeIcon icon={faChevronLeft} /> {t("topicsDetails.backButton")}
                            </button>
                        </div>
                        <div className="detailed-result-header">
                            <h1 className="topicDetails-header-title">
                                {showVotes ? t("topicsDetails.detailedResults") : t("topicsDetails.details")}
                            </h1>
                        </div>
                      <div>
                        <div>
                            <p className='detail-title'>{topicDetails.title}</p>
                        </div>
                        {topicDetails && topicDetails.status === "CREATED" && (
                            <div>
                                <p><strong>{t("topicsDetails.notStartedMessage")}</strong></p>
                            </div>
                        )}
                        {topicDetails.pdfFileId != null && (
                            <div>
                                <button className='button-pdf' onClick={() => handlePdfFetch(topicDetails.pdfFileId)}>
                                    {t("topicsDetails.viewDocument")} <FontAwesomeIcon icon={faFilePdf} />
                                </button>
                            </div>
                        )}
                        {showVotes && (
                            <div className="vote-summary-container">
                                <div className="vote-summary-grid">
                                    <span className="topic-detail-yes-sum">{t("topicsDetails.yes")}: {topicDetails.yesUsers.length}</span>
                                    <span className="topic-detail-no-sum">{t("topicsDetails.no")}: {topicDetails.noUsers.length}</span>
                                    <span className="topic-detail-abstained-sum">{t("topicsDetails.abstained")}: {topicDetails.abstainedUsers.length}</span>
                                    <span className="topic-detail-cant-vote-sum">{t("topicsDetails.cantVote")}: {topicDetails.cantVoteUsers.length}</span>
                                    <span className="topic-detail-havent-vote-sum">{t("topicsDetails.notVoted")}: {topicDetails.haventVoteUsers.length}</span>
                                    <span className="topic-detail-absent-sum">{t("topicsDetails.absent")}: {topicDetails.absentVoteUsers.length}</span>
                                </div>
                            </div>
                        )}
        {showVotes && (
         <div  className="table-wrapper">
            <table className="details-table">
                <thead>
                    <tr>
                        <th className="text-center details-table-th">{t("topicsDetails.image")}</th>
                        <th className="text-center details-table-th">{t("topicsDetails.fullName")}</th>
                        <th className="text-center details-table-th">{t("topicsDetails.vote")} <FontAwesomeIcon icon={faFilter} /></th>
                    </tr>
                </thead>
                <tbody>
                {[...(topicDetails.yesUsers || [])].map((user, index) => (
                        <tr key={`yes-${index}`}>
                            <td>
                                <img src={`data:image/jpeg;base64,${user.image}`} alt={`${user.name} ${user.surname}`} className="details-image" />
                            </td>
                            <td>{user.name} {user.surname}</td>
                            <td><span className="topic-detail-yes">{t("topicsDetails.yes")}</span></td>
                        </tr>
                    ))}

                    {[...(topicDetails.noUsers || [])].map((user, index) => (
                        <tr key={`no-${index}`}>
                            <td>
                                <img src={`data:image/jpeg;base64,${user.image}`} alt={`${user.name} ${user.surname}`} className="details-image" />
                            </td>
                            <td>{user.name} {user.surname}</td>
                            <td><span className="topic-detail-no">{t("topicsDetails.no")}</span></td>
                        </tr>
                    ))}

                    {[...(topicDetails.abstainedUsers || [])].map((user, index) => (
                        <tr key={`abstained-${index}`}>
                            <td>
                                <img src={`data:image/jpeg;base64,${user.image}`} alt={`${user.name} ${user.surname}`} className="details-image" />
                            </td>
                            <td>{user.name} {user.surname}</td>
                            <td><span className="topic-detail-abstained">{t("topicsDetails.abstained")}</span></td>
                        </tr>
                    ))}

                    {[...(topicDetails.cantVoteUsers || [])].map((user, index) => (
                        <tr key={`cantVote-${index}`}>
                            <td>
                                <img src={`data:image/jpeg;base64,${user.image}`} alt={`${user.name} ${user.surname}`} className="details-image" />
                            </td>
                            <td>{user.name} {user.surname}</td>
                            <td><span className="topic-detail-cant-vote">{t("topicsDetails.cantVote")}</span></td>
                        </tr>
                    ))}

                    {[...(topicDetails.haventVoteUsers || [])].map((user, index) => (
                        <tr key={`notVoted-${index}`}>
                            <td>
                                <img src={`data:image/jpeg;base64,${user.image}`} alt={`${user.name} ${user.surname}`} className="details-image" />
                            </td>
                            <td>{user.name} {user.surname}</td>
                            <td><span className="topic-detail-havent-vote">{t("topicsDetails.notVoted")}</span></td>
                        </tr>
                    ))}

                    {[...(topicDetails.absentVoteUsers || [])].map((user, index) => (
                        <tr key={`absent-${index}`}>
                            <td>
                                <img src={`data:image/jpeg;base64,${user.image}`} alt={`${user.name} ${user.surname}`} className="details-image" />
                            </td>
                            <td>{user.name} {user.surname}</td>
                            <td><span className="topic-detail-absent">{t("topicsDetails.absent")}</span></td>
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

export default TopicDetails;
