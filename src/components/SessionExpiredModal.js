import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSessionModal } from '../context/SessionModalContext';
import '../styles/SessionExpiredModal.css';

const SessionExpiredModal = () => {
  const { t } = useTranslation();
  const { isOpen, closeModal } = useSessionModal();
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    if (!isOpen) return;

    setCountdown(10);

    const countdownInterval = setInterval(() => {
      setCountdown(prev => prev - 1);
    }, 1000);

    const redirectTimer = setTimeout(() => {
      window.location.href = '/login';
    }, 10000);

    return () => {
      clearInterval(countdownInterval);
      clearTimeout(redirectTimer);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="sem-overlay">
      <div className="sem-modal">
        <h2>{t('sessionExpired.title')}</h2>
        <p>
          {t('sessionExpired.message')}
          <br />
          <strong>
            {t('sessionExpired.redirect', { count: countdown })}
          </strong>
        </p>
        <button
          className="btn-delete-modal"
          onClick={() => {
            closeModal();
            window.location.href = '/login';
          }}
        >
          {t('sessionExpired.logoutNow')}
        </button>
      </div>
    </div>
  );
};

export default SessionExpiredModal;
