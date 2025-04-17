import React, { useEffect, useState } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import Header from '../components/Header';
import HeadLinks from '../components/HeadLinks';
import { useNavigate, useParams } from 'react-router-dom';
import '../styles/TopicDetails.css';
import { initializeMobileMenu } from '../components/mobileMenu';


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
                console.log(data);
                setTopicDetails(data);
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
                    <title>Детални резултати</title>
                </Helmet>
            </HelmetProvider>
            <HeadLinks />
            <Header userInfo={userData} />
            <main className='topic-details-body-container'>
                <div className="detailed-result-header">
                    <div className="detailed-result-button-container">
                        <button onClick={handleBackButtonClick} className="back-button">
                            Назад
                        </button>
                    </div>
                    <h1 className="topic-header-title">Детални резултати</h1>
                </div>

                 
                {loading ? ( 
                    <div className="loading-spinner">
                        <img src={`${process.env.PUBLIC_URL}/images/loading.svg`} alt="Loading..." />
                    </div>
                ) : (
                    topicDetails && (
                        <>
                        {topicDetails.yesUsers?.length > 0 && (
                            <div>
                                <h2 className="d-flex justify-content-center m-3 detailed-table-header">Советници кои гласале за ({topicDetails.yesUsers.length}):</h2>
                                <table className="details-table">
                                    <thead>
                                        <tr>
                                            <th className="yes">Слика</th>
                                            <th className="yes">Име</th>
                                            <th className="yes">Презиме</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {topicDetails.yesUsers.map((user, index) => (
                                            <tr key={index}>
                                                <td>
                                                    <img src={`data:image/jpeg;base64,${user.image}`} alt={`${user.name} ${user.surname}`} className="details-image" />

                                                </td>
                                                <td>{user.name}</td>
                                                <td>{user.surname}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {topicDetails.noUsers?.length > 0 && (
                            <div>
                                <h2 className="d-flex justify-content-center m-3 detailed-table-header">Советници кои гласале против ({topicDetails.noUsers.length}):</h2>
                                <table className="details-table">
                                    <thead>
                                        <tr>
                                            <th className="no">Слика</th>
                                            <th className="no">Име</th>
                                            <th className="no">Презиме</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {topicDetails.noUsers.map((user, index) => (
                                            <tr key={index}>
                                                <td>
                                                    <img src={`data:image/jpeg;base64,${user.image}`} alt={`${user.name} ${user.surname}`} className="details-image" />

                                                </td>
                                                <td>{user.name}</td>
                                                <td>{user.surname}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {topicDetails.abstainedUsers?.length > 0 && (
                            <div>
                                <h2 className="d-flex justify-content-center m-3 detailed-table-header">Советници кои гласале воздржани ({topicDetails.abstainedUsers.length}):</h2>
                                <table className="details-table">
                                    <thead>
                                        <tr>
                                            <th className="abstained">Слика</th>
                                            <th className="abstained">Име</th>
                                            <th className="abstained">Презиме</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {topicDetails.abstainedUsers.map((user, index) => (
                                            <tr key={index}>
                                                <td>
                                                    <img src={`data:image/jpeg;base64,${user.image}`} alt={`${user.name} ${user.surname}`} className="details-image" />

                                                </td>
                                                <td>{user.name}</td>
                                                <td>{user.surname}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {topicDetails.cantVoteUsers?.length > 0 && (
                            <div>
                                <h2 className="d-flex justify-content-center m-3 detailed-table-header">Советници кои се иземуваат ({topicDetails.cantVoteUsers.length}):</h2>
                                <table className="details-table">
                                    <thead>
                                        <tr>
                                            <th className="cant-vote">Слика</th>
                                            <th className="cant-vote">Име</th>
                                            <th className="cant-vote">Презиме</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {topicDetails.cantVoteUsers.map((user, index) => (
                                            <tr key={index}>
                                                <td>
                                                    <img src={`data:image/jpeg;base64,${user.image}`} alt={`${user.name} ${user.surname}`} className="details-image" />

                                                </td>
                                                <td>{user.name}</td>
                                                <td>{user.surname}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {topicDetails.haventVoteUsers?.length > 0 && (
                            <div>
                                <h2 className="d-flex justify-content-center m-3 detailed-table-header">Советници кои не гласале ({topicDetails.haventVoteUsers.length}):</h2>
                                <table className="details-table">
                                    <thead>
                                        <tr>
                                            <th className="havent-vote">Слика</th>
                                            <th className="havent-vote">Име</th>
                                            <th className="havent-vote">Презиме</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {topicDetails.haventVoteUsers.map((user, index) => (
                                            <tr key={index}>
                                                <td>
                                                   <img src={`data:image/jpeg;base64,${user.image}`} alt={`${user.name} ${user.surname}`} className="details-image" />

                                                </td>
                                                <td>{user.name}</td>
                                                <td>{user.surname}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        {topicDetails.absentVoteUsers?.length > 0 && (
                            <div>
                                <h2 className="d-flex justify-content-center m-3 detailed-table-header">Советници кои се отсутни ({topicDetails.absentVoteUsers.length}):</h2>
                                <table className="details-table">
                                    <thead>
                                        <tr>
                                            <th className='absent'>Слика</th>
                                            <th className='absent'>Име</th>
                                            <th className='absent'>Презиме</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {topicDetails.absentVoteUsers.map((user, index) => (
                                            <tr key={index}>
                                                <td>
                                                   <img src={`data:image/jpeg;base64,${user.image}`} alt={`${user.name} ${user.surname}`} className="details-image" />

                                                </td>
                                                <td>{user.name}</td>
                                                <td>{user.surname}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                    )
                )}
            </main>
        </div>
    );
}

export default TopicDetails;
