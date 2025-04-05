import React, { useEffect, useState } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import '../styles/Home.css';
import Header from '../components/Header';
import HeadLinks from '../components/HeadLinks';
import { initializeMobileMenu } from '../components/mobileMenu';

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
            <HeadLinks />
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
                    </div>
                </main>
            </div>
            <footer className="footer text-white text-center">
                <p>&copy; {new Date().getFullYear()} Codeflux Macedonia</p>
            </footer>
        </div>
    );
}

export default Home;
