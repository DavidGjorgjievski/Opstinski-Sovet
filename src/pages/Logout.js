import React, { useEffect } from 'react';
import '../styles/Logout.css'; 
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { useAuth } from '../context/AuthContext'; 
import HeadLinks from '../components/HeadLinks';

const Logout = () => {
    const { logout } = useAuth(); 

     useEffect(() => {
        logout(); 
    }, [logout]); 

    return (
        <div className="logout-container">
            <HelmetProvider>
                <Helmet>
                    <title>Одјава</title>
                </Helmet>
            </HelmetProvider>
            <HeadLinks />
            <h1>Успешно сте одјавени!</h1>
            <p>Ви благодариме што ја искористивте нашата апликација.</p>
            <button onClick={() => window.location.href = '/login'} className="login-button">Најави се повторно</button>
        </div>
    );
};

export default Logout;
