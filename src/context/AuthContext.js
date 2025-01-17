import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [role, setRole] = useState(null);

    useEffect(() => {
    const token = localStorage.getItem('jwtToken');
    const userInfoString = localStorage.getItem('userInfo');
    
    if (token) {
        try {
            const decodedToken = jwtDecode(token);
            const isExpired = decodedToken.exp * 1000 < Date.now(); 
            
            if (!isExpired) {
                setIsAuthenticated(true);
                if (userInfoString) {
                    const userInfo = JSON.parse(userInfoString); // Parse stored userInfo
                    setRole(userInfo.role); // Restore the role
                }
            } else {
                console.warn("Token expired.");
                localStorage.removeItem('jwtToken');
                localStorage.removeItem('userInfo'); 
                setIsAuthenticated(false);
                setRole(null);
            }
        } catch (error) {
            console.error("Error decoding token:", error);
            localStorage.removeItem('jwtToken');
            localStorage.removeItem('userInfo'); 
            setIsAuthenticated(false);
            setRole(null);
        }
    }
    setLoading(false); 
}, []);

    const login = (token,userInfo,role) => {
        localStorage.setItem('jwtToken', token); 
        localStorage.setItem('userInfo', userInfo); 
        setIsAuthenticated(true);
        setRole(role);
    }

   const logout = () => {
    localStorage.clear();
    sessionStorage.clear();  
    setIsAuthenticated(false);
    setRole(null);
};

    return (
        <AuthContext.Provider value={{ isAuthenticated, role, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
