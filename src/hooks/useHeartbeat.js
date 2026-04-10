import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../api/axios';
import { buildCurrentPageLabel } from '../utils/pageKeyFromPath';
import { useTranslation } from 'react-i18next';

export default function useHeartbeat() {
    const location = useLocation();
    const { t } = useTranslation();

    // Interval heartbeat every 60 seconds
    useEffect(() => {
        const token = localStorage.getItem('jwtToken');
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        if (!token || userInfo?.role === 'ROLE_GUEST') return;

        const interval = setInterval(() => {
            api.post('/api/heartbeat').catch(() => {});
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    // Immediate heartbeat on every navigation
    useEffect(() => {
        const token = localStorage.getItem('jwtToken');
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        if (!token || userInfo?.role === 'ROLE_GUEST') return;

        const label = buildCurrentPageLabel(location.pathname, t);
        localStorage.setItem('currentPageLabel', label);
        api.post('/api/heartbeat').catch(() => {});
    }, [location.pathname, t]);
}
