import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ element, allowedRoles }) => {
    const { isAuthenticated, role, loading } = useAuth();

    if (loading) {
        return null; // or a loading spinner
    }

    // If not authenticated, redirect to login page
    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }

    // If user's role is not allowed, redirect to unauthorized page
    if (allowedRoles && !allowedRoles.includes(role)) {
        return <Navigate to="/unauthorized" />;
    }

    // Render the route's element if authenticated and authorized
    return element;
};

export default ProtectedRoute;
