import React, { useEffect, useState } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import '../styles/Profile.css'; 
import Header from '../components/Header';
import HeadLinks from '../components/HeadLinks';
import { useNavigate } from 'react-router-dom';
import { initializeMobileMenu } from '../components/mobileMenu';

function Profile() {
    const navigate = useNavigate();
    const [userData, setUserData] = useState(() => {
        const storedUserInfo = localStorage.getItem('userInfo');
        return storedUserInfo ? JSON.parse(storedUserInfo) : {}; 
    });

    useEffect(() => {
        const imageData = localStorage.getItem('image'); 
        if (imageData) {
            setUserData(prevData => ({ ...prevData, image: imageData }));
        }

        sessionStorage.removeItem('scrollPosition');

        const cleanupMobileMenu = initializeMobileMenu();

        return () => {
            cleanupMobileMenu(); 
        };
    }, [navigate]);

    const { username, name, surname, image } = userData;

    return (
        <div className="profile-container">
            <HelmetProvider>
                <Helmet>
                    <title>Профил</title>
                </Helmet>
            </HelmetProvider>
            <HeadLinks />
            <Header userInfo={userData} /> 
            <main>
                <div className="content-container">
                    <div className="d-flex flex-column">
                            <img src={`data:image/jpeg;base64,${image}`} className="profile-image" alt="Profile" />
                        <a href="/profile/change-image-form">
                            <button className="profile-change-button">Промени профилна</button>
                        </a>
                    </div>

                    <div className="profile-details">
                        <div className="d-flex flex-row">
                            <p className="profile-text fw-bold custom-mr-10">Корисничко име:</p>
                            <p className="profile-text">{username}</p>
                        </div>
                        <div className="d-flex flex-row">
                            <p className="profile-text fw-bold custom-mr-10">Име и презиме:</p>
                            <p className="profile-text">{`${name} ${surname}`}</p> 
                        </div>
                        <div>
                            <a href="/profile/change-password-form">
                                <button className="profile-change-button">Промени лозинка</button>
                            </a>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default Profile;
