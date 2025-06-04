import React, { useEffect, useState } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import Header from '../components/Header';
import '../styles/AdminPanel.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import UserTable from '../components/UserTable';
import ConfirmModal from '../components/ConfirmModal'; 
import { initializeMobileMenu } from '../components/mobileMenu'; 

function AdminPanel() {
    const navigate = useNavigate();
    const userData = JSON.parse(localStorage.getItem('userInfo')) || {};
    const token = localStorage.getItem('jwtToken');
    const [users, setUsers] = useState([]);
    const [modalVisible, setModalVisible] = useState(false); 
    const [userToDelete, setUserToDelete] = useState(null); 
    const [errorMessage, setErrorMessage] = useState(null);
    const [loading, setLoading] = useState(true); 

    useEffect(() => {
        const fetchUsers = async () => {
            if (token) {
                try {
                    const response = await axios.get(process.env.REACT_APP_API_URL + '/api/admin/users', {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                        },
                    });
                    setUsers(response.data);
                } catch (error) {
                    console.error("Error fetching users:", error);
                } finally {
                    setLoading(false); // Stop loading once data is fetched or error occurs
                }
            } else {
                navigate('/login');
            }
        };

        fetchUsers();

        const cleanupMobileMenu = initializeMobileMenu();

        sessionStorage.removeItem('scrollPosition');

        return () => {
            cleanupMobileMenu();
        };
    }, [navigate, token]);

    const handleDeleteClick = (user) => {
        setUserToDelete(user); 
        setModalVisible(true); 
    };

    const handleDeleteConfirm = async () => {
        if (!userToDelete) {
            return;
        }

        try {
            await axios.delete(`${process.env.REACT_APP_API_URL}/api/admin/users/delete/${userToDelete.username}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            setUsers((prevUsers) => prevUsers.filter(user => user.username !== userToDelete.username));

            setModalVisible(false);
            setUserToDelete(null);
            setErrorMessage(null);
        } catch (error) {
            console.error("Error deleting user:", error);
            setErrorMessage("Не може да се избрише корисникот затоа што е поврзан со други податоци.");
        }
    };

    const handleModalClose = () => {
        setModalVisible(false);
        setUserToDelete(null); 
        setErrorMessage(null);
    };

    const handleEditClick = (user) => {
        navigate(`/admin-panel/edit/${user.username}`);
    };

   return (
    <div className="admin-panel-container">
        <HelmetProvider>
            <Helmet>
                <title>Админ Панел</title>
            </Helmet>
        </HelmetProvider>
        <Header userInfo={userData} />

        <div className="admin-body d-flex flex-column">
            <div className="d-flex flex-row justify-content-between mb-4">
                <a href="/" className='a-tag-user-back-button'>
                    <button className="user-back-button">Назад</button>
                </a>
                <h1 className="admin-title">Сите корисници</h1>
                <a href="/admin-panel/add-form">
                    <button className="user-add-button">Додади корисник</button>
                </a>
            </div>

            {loading && (
                <div className="loading-spinner">
                    <img src={`${process.env.PUBLIC_URL}/images/loading.svg`} alt="Loading..." />
                </div>
            )}

            {!loading && (
                        <div className="admin-user-lists">
                            {users.length > 0 ? (
                                <>
                                    <UserTable
                                        users={users.filter(user => user.role === 'ROLE_ADMIN')}
                                        title="Админи"
                                        bgColor="primary"
                                        onDeleteClick={handleDeleteClick}
                                        onEditClick={handleEditClick}
                                    />

                                    <UserTable
                                        users={users.filter(user => user.role === 'ROLE_PRESIDENT')}
                                        title="Претседатели"
                                        bgColor="danger"
                                        onDeleteClick={handleDeleteClick}
                                        onEditClick={handleEditClick}
                                    />

                                    <UserTable
                                        users={users.filter(user => user.role === 'ROLE_USER')}
                                        title="Советници"
                                        bgColor="warning"
                                        onDeleteClick={handleDeleteClick}
                                        onEditClick={handleEditClick}
                                    />

                                    <UserTable
                                        users={users.filter(user => user.role === 'ROLE_SPECTATOR')}
                                        title="Набљудувачи"
                                        bgColor="secondary"
                                        onDeleteClick={handleDeleteClick}
                                        onEditClick={handleEditClick}
                                    />

                                    <UserTable
                                        users={users.filter(user => user.role === 'ROLE_PRESENTER')}
                                        title="Презентери"
                                        bgColor="info"
                                        onDeleteClick={handleDeleteClick}
                                        onEditClick={handleEditClick}
                                    />
                                </>
                            ) : (
                                <p className="text-center mt-4">Нема достапни корисници.</p>
                            )}
                    </div>
                )}
        </div>

        <ConfirmModal
            show={modalVisible}
            onClose={handleModalClose}
            onConfirm={handleDeleteConfirm}
            userName={userToDelete ? userToDelete.username : ''}
            errorMessage={errorMessage}
        />
    </div>
);
}

export default AdminPanel;
