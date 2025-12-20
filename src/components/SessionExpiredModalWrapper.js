import React from 'react';
import { useSessionModal } from '../context/SessionModalContext';
import SessionExpiredModal from './SessionExpiredModal';

export default function SessionExpiredModalWrapper() {
  const { isOpen, closeModal } = useSessionModal();

  if (!isOpen) return null;

  return (
    <SessionExpiredModal
      onClose={() => {
        closeModal();
        window.location.href = "/login";
      }}
    />
  );
}
