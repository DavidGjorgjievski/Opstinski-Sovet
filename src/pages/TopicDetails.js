import React, { useEffect, useState } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import Header from '../components/Header';
import HeadLinks from '../components/HeadLinks';
import { useNavigate, useParams } from 'react-router-dom';
import '../styles/TopicDetails.css';
import { initializeMobileMenu } from '../components/mobileMenu';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'; 
import { faChevronLeft, faFilter} from '@fortawesome/free-solid-svg-icons';
import Footer from '../components/Footer';



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
                 <div className='back-button-detailed-results-container'>
                    <button onClick={handleBackButtonClick} className="back-button">
                        <FontAwesomeIcon icon={faChevronLeft} /> Назад
                    </button>
                </div>
                <div className="detailed-result-header">
                    <h1 className="topic-header-title">Детални резултати</h1>
                </div>

                {loading ? ( 
                    <div className="loading-spinner">
                        <img src={`${process.env.PUBLIC_URL}/images/loading.svg`} alt="Loading..." />
                    </div>
                ) : (
                    topicDetails && (
                        <>
                        
                      <div>
        <div className="vote-summary-container">
        <div className="vote-summary-grid">
            <span className="topic-detail-yes-sum">За: {topicDetails.yesUsers.length}</span>
            <span className="topic-detail-no-sum">Против: {topicDetails.noUsers.length}</span>
            <span className="topic-detail-abstained-sum">Воздржан: {topicDetails.abstainedUsers.length}</span>
            <span className="topic-detail-cant-vote-sum">Се иземува: {topicDetails.cantVoteUsers.length}</span>
            <span className="topic-detail-havent-vote-sum">Не гласал: {topicDetails.haventVoteUsers.length}</span>
            <span className="topic-detail-absent-sum">Отсутен: {topicDetails.absentVoteUsers.length}</span>
        </div>
         </div>
         <div  className="table-wrapper">
             <table className="details-table">
            <thead>
                <tr>
                    <th className="text-center details-table-th">Слика</th>
                    <th className="text-center details-table-th">Име и презиме</th>
                    <th className="text-center details-table-th">Глас  <FontAwesomeIcon icon={faFilter} /></th>
                </tr>
            </thead>
            <tbody>
               {[...(topicDetails.yesUsers || [])].map((user, index) => (
                    <tr key={`yes-${index}`}>
                        <td>
                            <img src={`data:image/jpeg;base64,${user.image}`} alt={`${user.name} ${user.surname}`} className="details-image" />
                        </td>
                        <td>{user.name} {user.surname}</td>
                        <td><span className="topic-detail-yes">За</span></td>
                    </tr>
                ))}

                {[...(topicDetails.noUsers || [])].map((user, index) => (
                    <tr key={`no-${index}`}>
                        <td>
                            <img src={`data:image/jpeg;base64,${user.image}`} alt={`${user.name} ${user.surname}`} className="details-image" />
                        </td>
                        <td>{user.name} {user.surname}</td>
                        <td><span className="topic-detail-no">Против</span></td>
                    </tr>
                ))}

                {[...(topicDetails.abstainedUsers || [])].map((user, index) => (
                    <tr key={`abstained-${index}`}>
                        <td>
                            <img src={`data:image/jpeg;base64,${user.image}`} alt={`${user.name} ${user.surname}`} className="details-image" />
                        </td>
                        <td>{user.name} {user.surname}</td>
                        <td><span className="topic-detail-abstained">Воздржан</span></td>
                    </tr>
                ))}

                {[...(topicDetails.cantVoteUsers || [])].map((user, index) => (
                    <tr key={`cantVote-${index}`}>
                        <td>
                            <img src={`data:image/jpeg;base64,${user.image}`} alt={`${user.name} ${user.surname}`} className="details-image" />
                        </td>
                        <td>{user.name} {user.surname}</td>
                        <td><span className="topic-detail-cant-vote">Се иземува</span></td>
                    </tr>
                ))}

                {[...(topicDetails.haventVoteUsers || [])].map((user, index) => (
                    <tr key={`notVoted-${index}`}>
                        <td>
                            <img src={`data:image/jpeg;base64,${user.image}`} alt={`${user.name} ${user.surname}`} className="details-image" />
                        </td>
                        <td>{user.name} {user.surname}</td>
                        <td><span className="topic-detail-havent-vote">Не гласал</span></td>
                    </tr>
                ))}

                {[...(topicDetails.absentVoteUsers || [])].map((user, index) => (
                    <tr key={`absent-${index}`}>
                        <td>
                            <img src={`data:image/jpeg;base64,${user.image}`} alt={`${user.name} ${user.surname}`} className="details-image" />
                        </td>
                        <td>{user.name} {user.surname}</td>
                        <td><span className="topic-detail-absent">Отсутен</span></td>
                    </tr>
                ))}

            </tbody>
        </table>
         </div>
       
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
