import React, { useEffect, useState } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import Header from '../components/Header';
import '../styles/AdminPanel.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import UserTable from '../components/UserTable';
import ConfirmModal from '../components/ConfirmModal';
import { initializeMobileMenu } from '../components/mobileMenu';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'; 
import { faPlus,faChevronLeft} from '@fortawesome/free-solid-svg-icons';


function AdminPanel() {
    const { t } = useTranslation(); 
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
                    // Sort so that ACTIVE users come first
                    const sortedUsers = response.data.sort((a, b) => {
                        if (a.status === "ACTIVE" && b.status !== "ACTIVE") return -1;
                        if (a.status !== "ACTIVE" && b.status === "ACTIVE") return 1;
                        return 0;
                    });

                    setUsers(sortedUsers);

                } catch (error) {
                    console.error("Error fetching users:", error);
                } finally {
                    setLoading(false);
                }
            } else {
                navigate('/login');
            }
        };

        fetchUsers();
        const cleanupMobileMenu = initializeMobileMenu();
        sessionStorage.removeItem('scrollPosition');
        return () => cleanupMobileMenu();
    }, [navigate, token]);

    const handleDeleteClick = (user) => {
        setUserToDelete(user);
        setModalVisible(true);
    };

    const handleDeleteConfirm = async () => {
        if (!userToDelete) return;

        try {
            await axios.delete(`${process.env.REACT_APP_API_URL}/api/admin/users/delete/${userToDelete.username}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            setUsers((prevUsers) => prevUsers.filter(user => user.username !== userToDelete.username));
            setModalVisible(false);
            setUserToDelete(null);
            setErrorMessage(null);
        } catch (error) {
            console.error("Error deleting user:", error);
            setErrorMessage(t("adminPanel.deleteError"));
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
                    <title>{t("adminPanel.adminPanelTitle")}</title>
                </Helmet>
            </HelmetProvider>

            <Header userInfo={userData} />

            <div className="admin-body d-flex flex-column">
                <div className="admin-header-div">
                    <a href="/" className='a-tag-user-back-button'>
                        <button className="user-back-button"><FontAwesomeIcon icon={faChevronLeft} /> {t("adminPanel.backButton")}</button>
                    </a>
                    <h1 className="admin-title">{t("adminPanel.allUsers")}</h1>
                    <a href="/admin-panel/add-form">
                        <button className="user-add-button">{t("adminPanel.addUserButton")} <FontAwesomeIcon icon={faPlus} /></button>
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
                                    title={t("adminPanel.admins")}
                                    bgColor="user-role-admin"
                                    onDeleteClick={handleDeleteClick}
                                    onEditClick={handleEditClick}
                                />

                                <UserTable
                                    users={users.filter(user => user.role === 'ROLE_PRESIDENT')}
                                    title={t("adminPanel.presidents")}
                                    bgColor="user-role-president"
                                    onDeleteClick={handleDeleteClick}
                                    onEditClick={handleEditClick}
                                />

                                <UserTable
                                    users={users.filter(user => user.role === 'ROLE_USER')}
                                    title={t("adminPanel.councilors")}
                                    bgColor="user-role-councilor"
                                    onDeleteClick={handleDeleteClick}
                                    onEditClick={handleEditClick}
                                />

                                <UserTable
                                    users={users.filter(user => user.role === 'ROLE_SPECTATOR')}
                                    title={t("adminPanel.spectators")}
                                    bgColor="user-role-spectator"
                                    onDeleteClick={handleDeleteClick}
                                    onEditClick={handleEditClick}
                                />

                                <UserTable
                                    users={users.filter(user => user.role === 'ROLE_PRESENTER')}
                                    title={t("adminPanel.presenters")}
                                    bgColor="user-role-presenter"
                                    onDeleteClick={handleDeleteClick}
                                    onEditClick={handleEditClick}
                                />

                                <UserTable
                                    users={users.filter(user => user.role === 'ROLE_GUEST')}
                                    title={t("adminPanel.guests")}
                                    bgColor="user-role-guest"
                                    onDeleteClick={handleDeleteClick}
                                    onEditClick={handleEditClick}
                                />

                            </>
                        ) : (
                            <p className="text-center mt-4">{t("adminPanel.noUsersAvailable")}</p>
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
