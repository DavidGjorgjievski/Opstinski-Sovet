import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback
} from 'react';
import { setShowSessionExpired } from './sessionModalHelper';

const SessionModalContext = createContext();
export const useSessionModal = () => useContext(SessionModalContext);

export const SessionModalProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const showSessionExpired = useCallback(() => {
    if (isOpen) return;

    const selectedLanguage = localStorage.getItem('selectedLanguage');

    localStorage.clear();
    sessionStorage.clear();

    if (selectedLanguage) {
      localStorage.setItem('selectedLanguage', selectedLanguage);
    }

    setIsOpen(true);
  }, [isOpen]);

  const closeModal = () => setIsOpen(false);

  useEffect(() => {
    setShowSessionExpired(showSessionExpired);
  }, [showSessionExpired]);

  return (
    <SessionModalContext.Provider value={{ isOpen, closeModal }}>
      {children}
    </SessionModalContext.Provider>
  );
};
