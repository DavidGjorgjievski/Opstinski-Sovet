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
import { faPlus,faChevronLeft } from '@fortawesome/free-solid-svg-icons';


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
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [openStatus, setOpenStatus] = useState(false);
    const statusRef = React.useRef(null);

    const filteredByStatus =
    statusFilter === "ALL"
        ? users
        : users.filter(u => u.status === statusFilter);

    const admins = filteredByStatus.filter(u => u.role === "ROLE_ADMIN");
    const presidents = filteredByStatus.filter(u => u.role === "ROLE_PRESIDENT");
    const councilors = filteredByStatus.filter(u => u.role === "ROLE_USER");
    const spectators = filteredByStatus.filter(u => u.role === "ROLE_SPECTATOR");
    const presenters = filteredByStatus.filter(u => u.role === "ROLE_PRESENTER");
    const mayors = filteredByStatus.filter(u => u.role === "ROLE_MAYOR");
    const editors = filteredByStatus.filter(u => u.role === "ROLE_EDITOR");
    const guests = filteredByStatus.filter(u => u.role === "ROLE_GUEST");

    useEffect(() => {
    function handleClickOutside(event) {
        if (statusRef.current && !statusRef.current.contains(event.target)) {
            setOpenStatus(false);
        }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
        document.removeEventListener("mousedown", handleClickOutside);
    };
}, []);

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
                    <div className='back-button-admin-panel-div'>
                         <a href="/" className='a-tag-user-back-button'>
                            <button className="user-back-button"><FontAwesomeIcon icon={faChevronLeft} /> {t("adminPanel.backButton")}</button>
                        </a>
                    </div>
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

    {/* Status Filter */}
    <div className="filter-section">
        <h3 className="filters-title">{t("adminPanel.filters")}</h3>

        <label className="filter-label">{t("adminPanel.statusLabel")}</label>

        <div className="filter-select-container" ref={statusRef}>
            <div
                className="filter-select-box"
                onClick={() => setOpenStatus(!openStatus)}
            >
                {statusFilter === "ALL"
                    ? t("adminPanel.filterAll")
                    : statusFilter === "ACTIVE"
                    ? "ACTIVE"
                    : "INACTIVE"}
            </div>

            {openStatus && (
                <div className="filter-select-options">
                    <div
                        className={`filter-select-option ${
                            statusFilter === "ALL" ? "selected" : ""
                        }`}
                        onClick={() => {
                            setStatusFilter("ALL");
                            setOpenStatus(false);
                        }}
                    >
                        {t("adminPanel.filterAll")}
                    </div>

                    <div
                        className={`filter-select-option ${
                            statusFilter === "ACTIVE" ? "selected" : ""
                        }`}
                        onClick={() => {
                            setStatusFilter("ACTIVE");
                            setOpenStatus(false);
                        }}
                    >
                        ACTIVE
                    </div>

                    <div
                        className={`filter-select-option ${
                            statusFilter === "INACTIVE" ? "selected" : ""
                        }`}
                        onClick={() => {
                            setStatusFilter("INACTIVE");
                            setOpenStatus(false);
                        }}
                    >
                        INACTIVE
                    </div>
                </div>
            )}
        </div>
    </div>

                        
                        {users.length > 0 ? (
                            <>
                              {admins.length > 0 && (
                                <UserTable
                                    users={admins}
                                    title={t("adminPanel.admins")}
                                    bgColor="user-role-admin"
                                    onDeleteClick={handleDeleteClick}
                                    onEditClick={handleEditClick}
                                />
                            )}

                            {presidents.length > 0 && (
                                <UserTable
                                    users={presidents}
                                    title={t("adminPanel.presidents")}
                                    bgColor="user-role-president"
                                    onDeleteClick={handleDeleteClick}
                                    onEditClick={handleEditClick}
                                />
                            )}

                            {councilors.length > 0 && (
                                <UserTable
                                    users={councilors}
                                    title={t("adminPanel.councilors")}
                                    bgColor="user-role-councilor"
                                    onDeleteClick={handleDeleteClick}
                                    onEditClick={handleEditClick}
                                />
                            )}

                            {spectators.length > 0 && (
                                <UserTable
                                    users={spectators}
                                    title={t("adminPanel.spectators")}
                                    bgColor="user-role-spectator"
                                    onDeleteClick={handleDeleteClick}
                                    onEditClick={handleEditClick}
                                />
                            )}

                            {presenters.length > 0 && (
                                <UserTable
                                    users={presenters}
                                    title={t("adminPanel.presenters")}
                                    bgColor="user-role-presenter"
                                    onDeleteClick={handleDeleteClick}
                                    onEditClick={handleEditClick}
                                />
                            )}

                            {mayors.length > 0 && (
                                <UserTable
                                    users={mayors}
                                    title={t("adminPanel.mayors")}
                                    bgColor="user-role-mayor"
                                    onDeleteClick={handleDeleteClick}
                                    onEditClick={handleEditClick}
                                />
                            )}

                            {editors.length > 0 && (
                                <UserTable
                                    users={editors}
                                    title={t("adminPanel.editors")}
                                    bgColor="user-role-editor"
                                    onDeleteClick={handleDeleteClick}
                                    onEditClick={handleEditClick}
                                />
                            )}

                            {guests.length > 0 && (
                                <UserTable
                                    users={guests}
                                    title={t("adminPanel.guests")}
                                    bgColor="user-role-guest"
                                    onDeleteClick={handleDeleteClick}
                                    onEditClick={handleEditClick}
                                />
                            )}


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
