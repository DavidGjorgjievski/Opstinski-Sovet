import React, { useEffect, useState } from 'react';
import { Link } from "react-router-dom";
import Header from '../components/Header';
import '../styles/ChangeEmail.css';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { initializeMobileMenu } from '../components/mobileMenu';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faEnvelope } from "@fortawesome/free-solid-svg-icons";
import api from '../api/axios'; // Axios instance with JWT handling

const ChangeEmail = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [errorKey, setErrorKey] = useState(null);
  const [successKey, setSuccessKey] = useState(null);

  const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};

  useEffect(() => {
    const cleanupMobileMenu = initializeMobileMenu();
    return () => cleanupMobileMenu();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorKey(null);
    setSuccessKey(null);

    if (email !== confirmEmail) {
      setErrorKey('changeEmail.emailMismatch');
      return;
    }

    try {
      // Send plain string without quotes
      await api.post("/api/change-email", new Blob([email], { type: 'text/plain' }));

      // Update local storage after success
      const storedUser = JSON.parse(localStorage.getItem("userInfo"));
      if (storedUser) {
        storedUser.email = email;
        localStorage.setItem("userInfo", JSON.stringify(storedUser));
      }

      setSuccessKey('changeEmail.success');
      setEmail('');
      setConfirmEmail('');

    } catch (error) {
      console.error('Error changing email:', error);
      // All errors, including 400, 401, 403, etc., show general error
      setErrorKey('changeEmail.generalError');
    }
  };

  return (
    <div className="change-email-container">
      <HelmetProvider>
        <Helmet>
          <title>{t('changeEmail.title')}</title>
        </Helmet>
      </HelmetProvider>
      <Header userInfo={userInfo} />

      <main className="change-email-body">
        <div className="email-change-header">
          <h2 className="email-change-title">{t('changeEmail.header')}</h2>
        </div>

        <form onSubmit={handleSubmit} className="change-email-form">
          {/* New Email */}
          <div className="form-group">
            <label htmlFor="email">{t('changeEmail.new')}</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="change-email-input-field"
            />
          </div>

          {/* Confirm Email */}
          <div className="form-group">
            <label htmlFor="confirmEmail">{t('changeEmail.confirm')}</label>
            <input
              type="email"
              id="confirmEmail"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              required
              className="change-email-input-field"
            />
          </div>

          {errorKey && <p className="error-message-email">{t(errorKey)}</p>}
          {successKey && <p className="success-message-email">{t(successKey)}</p>}

          <div className='d-flex flex-row mt-2'>
            <button type="submit" className="button-change-email-submit me-2">
              {t('changeEmail.submit')} <FontAwesomeIcon icon={faEnvelope} />
            </button>
            <Link to="/profile" className="button-change-email-back">
              <FontAwesomeIcon icon={faChevronLeft} /> {t('changeEmail.back')}
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
};

export default ChangeEmail;
