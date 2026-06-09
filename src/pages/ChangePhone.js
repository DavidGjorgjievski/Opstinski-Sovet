import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import Header from '../components/Header';
import '../styles/ChangeEmail.css';
import '../styles/AddUserForm.css';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faPhone } from "@fortawesome/free-solid-svg-icons";
import api from '../api/axios';
import COUNTRY_CODES from '../utils/countryCodes';
import { useRef } from 'react';
import { useEffect } from 'react';

const ChangePhone = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [countryCode, setCountryCode] = useState("+389");
  const [phoneNumber, setPhoneNumber] = useState('');
  const [openCountryCode, setOpenCountryCode] = useState(false);
  const [errorKey, setErrorKey] = useState(null);
  const [successKey, setSuccessKey] = useState(null);
  const countryCodeRef = useRef(null);

  useEffect(() => {
    const stored = localStorage.getItem('userInfo');
    if (stored) {
      const user = JSON.parse(stored);
      if (user.phoneCountryCode) setCountryCode(user.phoneCountryCode);
      if (user.phoneNumber) setPhoneNumber(user.phoneNumber);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (countryCodeRef.current && !countryCodeRef.current.contains(e.target)) {
        setOpenCountryCode(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorKey(null);
    setSuccessKey(null);

    const localNumber = phoneNumber.trim();

    try {
      await api.post("/api/change-phone", {
        phoneCountryCode: localNumber ? countryCode : null,
        phoneNumber: localNumber || null,
      });

      const stored = localStorage.getItem('userInfo');
      if (stored) {
        const user = JSON.parse(stored);
        user.phoneCountryCode = localNumber ? countryCode : null;
        user.phoneNumber = localNumber || null;
        localStorage.setItem('userInfo', JSON.stringify(user));
      }

      setSuccessKey('changePhone.success');
    } catch (error) {
      setErrorKey('changePhone.generalError');
    }
  };

  const selectedCountry = COUNTRY_CODES.find(c => c.code === countryCode) || COUNTRY_CODES[0];

  return (
    <div className="change-email-container">
      <HelmetProvider>
        <Helmet>
          <title>{t('changePhone.title')}</title>
        </Helmet>
      </HelmetProvider>
      <Header />

      <main className="change-email-body">
        <div className="email-change-header">
          <h2 className="email-change-title">{t('changePhone.header')}</h2>
        </div>

        <form onSubmit={handleSubmit} className="change-email-form">
          <div className="form-group">
            <label>{t('changePhone.new')}</label>
            <div className="phone-input-row">
              <div className="phone-code-wrapper" ref={countryCodeRef}>
                <div className="phone-code-trigger" onClick={() => setOpenCountryCode(!openCountryCode)}>
                  <img src={`https://flagcdn.com/w20/${selectedCountry.iso}.png`} alt="" className="phone-flag-img" />
                  <span>{selectedCountry.code}</span>
                  <span className="phone-code-arrow">▾</span>
                </div>
                {openCountryCode && (
                  <div className="phone-code-options">
                    {COUNTRY_CODES.map(({ code, iso, name }) => (
                      <div
                        key={code}
                        className={`phone-code-option ${countryCode === code ? "selected" : ""}`}
                        onClick={() => { setCountryCode(code); setOpenCountryCode(false); }}
                      >
                        <img src={`https://flagcdn.com/w20/${iso}.png`} alt="" className="phone-flag-img" />
                        <span>{code}</span>
                        <span className="phone-code-name">{name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <input
                type="tel"
                className="change-email-input-field"
                style={{ marginBottom: 0 }}
                placeholder={t('changePhone.phonePlaceholder')}
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>
          </div>

          {errorKey && <p className="error-message-email">{t(errorKey)}</p>}
          {successKey && <p className="success-message-email">{t(successKey)}</p>}

          <div className='d-flex flex-row mt-3'>
            <button type="submit" className="add-form-submit-button me-2">
              {t('changePhone.submit')} <FontAwesomeIcon icon={faPhone} />
            </button>
            <button type="button" className="add-form-back-button" onClick={() => navigate('/profile')}>
              <span className="back-icon"><FontAwesomeIcon icon={faChevronLeft} /></span>
              {t('common.back')}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default ChangePhone;
