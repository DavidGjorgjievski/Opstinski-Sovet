import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import '../styles/ChangePassword.css'; 
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { initializeMobileMenu } from '../components/mobileMenu';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const ChangePassword = () => {
  const { t } = useTranslation();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  // Store KEYS, not translated strings
  const [passwordErrorKey, setPasswordErrorKey] = useState(null); // string | null
  const [successKey, setSuccessKey] = useState(null);             // string | null

  const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {}; 
  const [token] = useState(localStorage.getItem('jwtToken'));
  const navigate = useNavigate();

  useEffect(() => {
    const cleanupMobileMenu = initializeMobileMenu();
    return () => cleanupMobileMenu();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPasswordErrorKey(null);
    setSuccessKey(null);

    if (newPassword !== confirmPassword) {
      setPasswordErrorKey('changePassword.passwordMismatch');
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
          setPasswordErrorKey('changePassword.incorrectCurrent');
        } else {
          setPasswordErrorKey('changePassword.generalError');
        }
        return;
      }

      if (!response.ok) throw new Error('Network response was not ok');

      setSuccessKey('changePassword.success');
    } catch (error) {
      console.error('Error changing password:', error.message);
      setPasswordErrorKey('changePassword.generalError');
    }
  };

  return (
    <div className="change-password-container">
      <HelmetProvider>
        <Helmet>
          <title>{t('changePassword.title')}</title>
        </Helmet>
      </HelmetProvider>
      <Header userInfo={userInfo} />

      <main className="change-password-body">
        <div className="password-change-header">
          <h1 className="password-change-title">{t('changePassword.header')}</h1>
        </div>
        <div>
          <form onSubmit={handleSubmit} className="change-password-form">
            <div className="form-group">
              <label htmlFor="currentPassword">{t('changePassword.current')}</label>
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
              <label htmlFor="newPassword">{t('changePassword.new')}</label>
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
              <label htmlFor="confirmPassword">{t('changePassword.confirm')}</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className='form-control'
              />
            </div>

            {passwordErrorKey && <p className="error-message">{t(passwordErrorKey)}</p>}
            {successKey && <p className="success-message">{t(successKey)}</p>}

            <div className='d-flex flex-row mt-2'>
              <button type="submit" className="button-change-password-submit me-2">
                {t('changePassword.submit')}
              </button>
              <button
                type="button"
                onClick={() => navigate('/profile')}
                className="button-change-password-back"
              >
                {t('changePassword.back')}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default ChangePassword;
