import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import api from '../api/axios';
import { buildCurrentPageLabel } from '../utils/pageKeyFromPath';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

function isTokenValid(token) {
    try {
        return jwtDecode(token).exp * 1000 > Date.now();
    } catch {
        return false;
    }
}

export default function useHeartbeat() {
    const location = useLocation();
    const { t } = useTranslation();
    const { isAuthenticated } = useAuth();

    // Interval heartbeat every 60 seconds
    useEffect(() => {
        const token = localStorage.getItem('jwtToken');
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        if (!token || !isTokenValid(token) || userInfo?.role === 'ROLE_GUEST') return;

        const interval = setInterval(() => {
            api.post('/api/heartbeat').catch(() => {});
        }, 60000);

        return () => clearInterval(interval);
    }, [isAuthenticated]);

    // Immediate heartbeat on every navigation
    useEffect(() => {
        const token = localStorage.getItem('jwtToken');
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        if (!token || !isTokenValid(token) || userInfo?.role === 'ROLE_GUEST') return;

        const label = buildCurrentPageLabel(location.pathname, t);
        localStorage.setItem('currentPageLabel', label);
        api.post('/api/heartbeat').catch(() => {});
    }, [location.pathname, t]);
}
