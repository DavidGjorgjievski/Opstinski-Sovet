import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import Header from '../components/Header';
import '../styles/ChangePassword.css'; 
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash, faChevronLeft, faLock } from "@fortawesome/free-solid-svg-icons";
import api from '../api/axios';

const ChangePassword = () => {
  const { t } = useTranslation();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordErrorKey, setPasswordErrorKey] = useState(null); // string | null
  const [successMessage, setSuccessMessage] = useState(null);     // string | null
  const navigate = useNavigate();

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPasswordErrorKey(null);
    setSuccessMessage(null);

    if (newPassword !== confirmPassword) {
      setPasswordErrorKey('changePassword.passwordMismatch');
      return;
    }

    try {
      const { data } = await api.post("/api/change-password", {
        currentPassword,
        newPassword
      });

      // Use backend message if available
      setSuccessMessage(data?.message || t('changePassword.success'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

    } catch (error) {
      console.error('Error changing password:', error.message);

      if (error.response?.status === 401) {
        setPasswordErrorKey('changePassword.sessionExpired');
        // optional: redirect to login
      } else if (error.response?.status === 400) {
        const errorMessage = error.response.data?.message || '';
        if (errorMessage.includes("Incorrect current password")) {
          setPasswordErrorKey('changePassword.incorrectCurrent');
        } else {
          setPasswordErrorKey('changePassword.generalError');
        }
      } else {
        setPasswordErrorKey('changePassword.generalError');
      }
    }
  };

  return (
    <div className="change-password-container">
      <HelmetProvider>
        <Helmet>
          <title>{t('changePassword.title')}</title>
        </Helmet>
      </HelmetProvider>
      <Header />

      <main className="change-password-body">
        <div className="password-change-header">
          <h2 className="password-change-title">{t('changePassword.header')}</h2>
        </div>
        <div>
          <form onSubmit={handleSubmit} className="change-password-form">
            {/* Current Password */}
            <div className="form-group password-wrapper">
              <label htmlFor="currentPassword">{t('changePassword.current')}</label>
              <div className="input-with-icon">
                <input
                  type={showCurrent ? "text" : "password"}
                  id="currentPassword"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="change-password-input-field"
                />
                <FontAwesomeIcon
                  icon={showCurrent ? faEyeSlash : faEye}
                  className="eye-icon"
                  onClick={() => setShowCurrent(!showCurrent)}
                />
              </div>
            </div>

            {/* New Password */}
            <div className="form-group password-wrapper">
              <label htmlFor="newPassword">{t('changePassword.new')}</label>
              <div className="input-with-icon">
                <input
                  type={showNew ? "text" : "password"}
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="change-password-input-field"
                />
                <FontAwesomeIcon
                  icon={showNew ? faEyeSlash : faEye}
                  className="eye-icon"
                  onClick={() => setShowNew(!showNew)}
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div className="form-group password-wrapper">
              <label htmlFor="confirmPassword">{t('changePassword.confirm')}</label>
              <div className="input-with-icon">
                <input
                  type={showConfirm ? "text" : "password"}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="change-password-input-field"
                />
                <FontAwesomeIcon
                  icon={showConfirm ? faEyeSlash : faEye}
                  className="eye-icon"
                  onClick={() => setShowConfirm(!showConfirm)}
                />
              </div>
            </div>

            {passwordErrorKey && <p className="error-message">{t(passwordErrorKey)}</p>}
            {successMessage && <p className="success-message">{successMessage}</p>}

            <div className='d-flex flex-row mt-2'>
              <button type="submit" className="add-form-submit-button me-2">
                {t('changePassword.submit')}{" "}
                <FontAwesomeIcon icon={faLock} />
              </button>
              <button
                type="button"
                className="add-form-back-button"
                onClick={() => navigate('/profile')}
              >
                <span className="back-icon">
                  <FontAwesomeIcon icon={faChevronLeft} />
                </span>
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
