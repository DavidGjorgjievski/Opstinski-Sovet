import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../styles/HeaderPresenter.css'; 

const HeaderPresenter = () => {
    const navigate = useNavigate();
    const { id: sessionID } = useParams();
    const { municipalityId } = useParams();
    return (
        <header>
            <div className='d-flex flex-start'>
                 <img
                    id="logo-img"
                    src={`${process.env.PUBLIC_URL}/images/grb.png`}
                    className="logo-img-presenter"
                    alt="Logo"
                    onClick={() => window.location.reload()} 
                />
                <button 
                    className="back-button-presenter"
                    onClick={() => navigate(`/municipalities/${municipalityId}/sessions#session-${sessionID}`)}
                >
                    Назад
                </button>
            </div>
        </header>
    );
};

export default HeaderPresenter;
