import React, { useEffect, useState } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import Header from '../components/Header';
import '../styles/AdminPanel.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import UserTable from '../components/UserTable';
import ConfirmModal from '../components/ConfirmModal';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'; 
import { faPlus,faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import api from '../api/axios';


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
    const [openStatus, setOpenStatus] = useState(false);
    const statusRef = React.useRef(null);

    const [openMunicipality, setOpenMunicipality] = useState(false);
    const municipalityRef = React.useRef(null);
    const [municipalities, setMunicipalities] = useState(
        JSON.parse(localStorage.getItem("municipalities")) || []
    );

    const [statusFilter, setStatusFilter] = useState(
        localStorage.getItem("statusFilter") || "ALL"
    );

    const [municipalityFilter, setMunicipalityFilter] = useState(
        localStorage.getItem("municipalityFilter") || "ALL"
    );

    useEffect(() => {
        localStorage.setItem("statusFilter", statusFilter);
    }, [statusFilter]);

    useEffect(() => {
        localStorage.setItem("municipalityFilter", municipalityFilter);
    }, [municipalityFilter]);

    const filteredByStatus =
        statusFilter === "ALL"
            ? users
            : users.filter(u => u.status === statusFilter);

    const filteredByMunicipality =
    municipalityFilter === "ALL"
        ? filteredByStatus
        : filteredByStatus.filter(
            u => u.municipalityName === municipalityFilter
        );

    const admins = filteredByMunicipality.filter(u => u.role === "ROLE_ADMIN");
    const presidents = filteredByMunicipality.filter(u => u.role === "ROLE_PRESIDENT");
    const councilors = filteredByMunicipality.filter(u => u.role === "ROLE_USER");
    const spectators = filteredByMunicipality.filter(u => u.role === "ROLE_SPECTATOR");
    const presenters = filteredByMunicipality.filter(u => u.role === "ROLE_PRESENTER");
    const mayors = filteredByMunicipality.filter(u => u.role === "ROLE_MAYOR");
    const editors = filteredByMunicipality.filter(u => u.role === "ROLE_EDITOR");
    const guests = filteredByMunicipality.filter(u => u.role === "ROLE_GUEST");

    useEffect(() => {
        function handleClickOutside(event) {
            if (statusRef.current && !statusRef.current.contains(event.target)) {
                setOpenStatus(false);
            }
            if (municipalityRef.current && !municipalityRef.current.contains(event.target)) {
                setOpenMunicipality(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    useEffect(() => {
        const fetchUsers = async () => {
            if (!token) {
                // Don't navigate anywhere, just exit the fetch
                setLoading(false);
                return;
            }

            try {
                const response = await api.get('/api/admin/users'); // using your api instance

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
        };

        fetchUsers();

        sessionStorage.removeItem('scrollPosition');

    }, [token]);

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

    const fetchMunicipalities = async () => {
    try {
        const cached = localStorage.getItem("municipalities");

        const rawUserId = userData && userData.municipalityId;
        const userMunicipalityId = rawUserId != null ? Number(rawUserId) : null;

        const moveUserMunicipalityFirst = (arr) => {
            if (!userMunicipalityId) return arr;
            const index = arr.findIndex(item => Number(item.id) === userMunicipalityId);
            if (index === -1) return arr;
            const item = arr[index];
            const rest = arr.slice(0, index).concat(arr.slice(index + 1));
            return [item, ...rest];
        };

        // If already in localStorage → use it
        if (cached) {
            const parsed = JSON.parse(cached);
            setMunicipalities(moveUserMunicipalityFirst(parsed));
            return;
        }

        // Otherwise → Fetch from backend
        const response = await fetch(
            process.env.REACT_APP_API_URL + "/api/municipalities",
            {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            }
        );

        if (!response.ok) {
            throw new Error("Failed to fetch municipalities");
        }

        const data = await response.json();

        localStorage.setItem("municipalities", JSON.stringify(data));
        setMunicipalities(moveUserMunicipalityFirst(data));

    } catch (err) {
        console.error("Error fetching municipalities:", err);
    }
};

    useEffect(() => {
        if (!municipalities || municipalities.length === 0) {
            fetchMunicipalities();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);



    return (
        <div className="admin-panel-container">
            <HelmetProvider>
                <Helmet>
                    <title>{t("adminPanel.adminPanelTitle")}</title>
                </Helmet>
            </HelmetProvider>

            <Header />

            <div className="admin-body d-flex flex-column">
                <div className="admin-header-div">
                    <div className='back-button-admin-panel-div'>
                         <button className="user-back-button">
                            <span className="back-icon">
                                <FontAwesomeIcon icon={faChevronLeft} />
                            </span>
                            {t("adminPanel.backButton")}
                        </button>
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

                    <div className='filter-section-body'>
                            <div className="filter-subsection">
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
                            <div className="filter-subsection">
                                <label className="filter-label">{t("adminpanel.municipality")}:</label>

                                <div className="filter-select-container" ref={municipalityRef}>
                                    <div
                                        className="filter-select-box"
                                        onClick={() => setOpenMunicipality(!openMunicipality)}
                                    >
                                        {municipalityFilter === "ALL"
                                            ? t("adminPanel.filterAll")
                                            : municipalities.find(m => m.name === municipalityFilter)?.name || ""}
                                    </div>

                                    {openMunicipality && (
                                        <div className="filter-select-options">
                                            <div
                                                className={`filter-select-option ${municipalityFilter === "ALL" ? "selected" : ""}`}
                                                onClick={() => {
                                                    setMunicipalityFilter("ALL");
                                                    setOpenMunicipality(false);
                                                }}
                                            >
                                                {t("adminPanel.filterAll")}
                                            </div>

                                          {municipalities.map(m => (
                                                <div
                                                    key={m.id}
                                                   className={`filter-select-option ${
                                                        municipalityFilter === m.name ? "selected" : ""
                                                    }`}
                                                    onClick={() => {
                                                        setMunicipalityFilter(m.name);
                                                        setOpenMunicipality(false);
                                                    }}
                                                >
                                                    {m.name}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
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
