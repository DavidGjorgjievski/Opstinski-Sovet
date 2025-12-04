import React, { useEffect, useState } from 'react';
import { Link } from "react-router-dom";
import Header from '../components/Header';
import '../styles/ChangeEmail.css';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { initializeMobileMenu } from '../components/mobileMenu';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faEnvelope } from "@fortawesome/free-solid-svg-icons";

const ChangeEmail = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [errorKey, setErrorKey] = useState(null);
  const [successKey, setSuccessKey] = useState(null);

  const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};
  const [token] = useState(localStorage.getItem('jwtToken'));

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
    const response = await fetch(process.env.REACT_APP_API_URL + "/api/change-email", {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'text/plain'   // ✅ IMPORTANT: since backend expects String
      },
      body: email
    });

    if (response.status === 400) {
      const errorMessage = await response.text();
      if (errorMessage.includes("Email already in use")) {
        setErrorKey('changeEmail.emailExists');
      } else {
        setErrorKey('changeEmail.generalError');
      }
      return;
    }

    if (!response.ok) throw new Error('Network response was not ok');

    // ✅ ✅ ✅ UPDATE LOCAL STORAGE AFTER SUCCESS
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));
    if (userInfo) {
      userInfo.email = email;
      localStorage.setItem("userInfo", JSON.stringify(userInfo));
    }

    setSuccessKey('changeEmail.success');
  } catch (error) {
    console.error('Error changing email:', error.message);
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
