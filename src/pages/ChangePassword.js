import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import '../styles/ChangePassword.css'; 
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { initializeMobileMenu } from '../components/mobileMenu';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';

const ChangePassword = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {}; 
  const [token] = useState(localStorage.getItem('jwtToken'));
  const navigate = useNavigate();

  useEffect(() => {
    const cleanupMobileMenu = initializeMobileMenu();

    return () => {
      cleanupMobileMenu();
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setPasswordError(null);
    setSuccessMessage('');

    if (newPassword !== confirmPassword) {
      setPasswordError('Новата лозинка и потврдата не се совпаѓаат.');
      return;
    }

    try {
      const response = await fetch(process.env.REACT_APP_API_URL + "/api/change-password", {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`, 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      if (response.status === 400) {
        const errorMessage = await response.text();
        if (errorMessage.includes("Incorrect current password")) {
          setPasswordError('Погрешна сегашна лозинка.'); 
        } else {
          setPasswordError('Нешто не е во ред при промената на лозинката.');
        }
        return;
      }

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.text(); 
      console.log(data)
      setSuccessMessage("Лозинката е променета успешно."); 
    } catch (error) {
      console.error('Error changing password:', error.message);
      setPasswordError('Нешто не е во ред при промената на лозинката.'); 
    }
  };

  return (
    <div className="change-password-container">
      <HelmetProvider>
        <Helmet>
          <title>Промена на лозинка</title>
        </Helmet>
      </HelmetProvider>
      <Header userInfo={userInfo} />

      <main className="change-password-body">
        <div className="password-change-header">
          <h1 className="password-change-title">Промена на лозинка</h1>
        </div>
        <div>
          <form onSubmit={handleSubmit} className="change-password-form">
            <div className="form-group">
              <label htmlFor="currentPassword">Сегашна лозинка</label>
              <input
                type="password"
                id="currentPassword"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className='form-control'
              />
            </div>

            <div className="form-group">
              <label htmlFor="newPassword">Нова лозинка</label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className='form-control'
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Потврди нова лозинка</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className='form-control'
              />
            </div>

            {passwordError && <p className="error-message">{passwordError}</p>}
            {successMessage && <p className="success-message">{successMessage}</p>}

            <div className='d-flex flex-row mt-2'>
              <button type="submit" className="button-change-password-submit me-2">Промени лозинка</button>
              <button type="button" onClick={() => navigate('/profile')} className="button-change-password-back">Назад</button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ChangePassword;
