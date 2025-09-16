import React, { useEffect, useState } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import Header from '../components/Header';
import { useNavigate, useParams } from 'react-router-dom';
import '../styles/TopicDetails.css';
import { initializeMobileMenu } from '../components/mobileMenu';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'; 
import { faChevronLeft, faFilter, faFilePdf } from '@fortawesome/free-solid-svg-icons';
import Footer from '../components/Footer';
import { useTranslation } from "react-i18next";



function TopicDetails() {
    const navigate = useNavigate();
    const { id, idt } = useParams();
    const { municipalityId } = useParams();
    const [userData] = useState(() => {
        const storedUserInfo = localStorage.getItem('userInfo');
        return storedUserInfo ? JSON.parse(storedUserInfo) : {};
    });
    const [topicDetails, setTopicDetails] = useState(null);
    const [loading, setLoading] = useState(true); // Add loading state
    const jwtToken = localStorage.getItem('jwtToken') || '';
    const [showVotes, setShowVotes] = useState(null);
    const { t } = useTranslation();

 useEffect(() => {
        const fetchTopicDetails = async () => {
            setLoading(true); // Show loading before fetching data
            try {
                const response = await fetch(`${process.env.REACT_APP_API_URL}/api/topics/details/${idt}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${jwtToken}`,
                        'Content-Type': 'application/json',
                    },
                });
                if (!response.ok) {
                    throw new Error('Failed to fetch topic details');
                }
                const data = await response.json();
                setTopicDetails(data);
                const shouldShowVotes = data.status === 'ACTIVE' || data.status === 'FINISHED';
                setShowVotes(shouldShowVotes);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false); // Hide loading after data is fetched
            }
        };

        fetchTopicDetails();
    }, [navigate, id, idt, jwtToken]);


    useEffect(() => {
    // Initialize mobile menu
    const cleanupMobileMenu = initializeMobileMenu();

    // Cleanup function to remove event listeners or any other cleanup actions
    return () => {
      cleanupMobileMenu();
    };
  }, []);


  const handlePdfFetch = async (pdfId) => {
    try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/topics/pdf/${pdfId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${jwtToken}`,
                'Accept': 'application/pdf',
            },
        });

        if (response.ok) {
            // Create a blob from the response
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            // Open the PDF in a new tab
            window.open(url, '_blank');
        } else {
            console.error('PDF not found or could not be retrieved.');
        }
    } catch (error) {
        console.error('Error fetching PDF:', error);
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
            <Header userInfo={userData} />
            <main className='topic-details-body-container'>
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

                {loading ? ( 
                    <div className="loading-spinner">
                        <img src={`${process.env.PUBLIC_URL}/images/loading.svg`} alt="Loading..." />
                    </div>
                ) : (
                    topicDetails && (
                        <>
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
