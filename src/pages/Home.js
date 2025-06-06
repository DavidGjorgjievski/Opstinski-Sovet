import React, { useEffect, useState } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { Link } from 'react-router-dom'; // Import Link from react-router-dom
import '../styles/Home.css';
import Header from '../components/Header';
import { initializeMobileMenu } from '../components/mobileMenu';
import Footer from '../components/Footer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBuildingColumns } from '@fortawesome/free-solid-svg-icons';

function Home() {
    const [userData, setUserData] = useState(() => {
        const storedUserInfo = localStorage.getItem('userInfo');
        return storedUserInfo ? JSON.parse(storedUserInfo) : {}; 
    });

    useEffect(() => {
        const imageData = localStorage.getItem('image'); 
        if (imageData) {
            setUserData(prevData => ({ ...prevData, image: imageData }));
        }
       
        const cleanupMobileMenu = initializeMobileMenu();

        sessionStorage.removeItem('scrollPosition');

        return () => {
            cleanupMobileMenu();
        };
    }, []);

    return (
        <div className="home-container">
            <HelmetProvider>
                <Helmet>
                    <title>Почетна</title>
                </Helmet>
            </HelmetProvider>
            <Header userInfo={userData} />
            <div className="main-content"> {/* Added div here */}
                <main>
                    <div className="introduction">
                        <div className="introduction-header text-center my-3">
                            <h1 className="display-4 fw-bold">
                                Добредојде на системот за гласање на точки во седници на Општина.
                            </h1>
                        </div>
                        <div className="introduction-body">
                            <p className="lead">
                                Во секоја седница, се вклучуваат советници, меѓу кои и претседателот на советот, кој ја води
                                самата седница. Тие се одговорни за креирање и прифаќање на предлози кои
                                влијаат на сите граѓани во општината.
                            </p>
                        </div>
                        <div className="d-flex justify-content-center">
                            <Link to="/municipalities">
                                <button className="municipality-nav-button">Општини <FontAwesomeIcon icon={faBuildingColumns} /></button>
                            </Link>
                        </div>
                    </div>
                </main>
            </div>
            <Footer />
        </div>
    );
}

export default Home;
