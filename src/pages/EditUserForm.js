import React, { useState, useEffect } from "react";
import { Helmet, HelmetProvider } from "react-helmet-async";
import Header from "../components/Header";
import { useNavigate, useParams } from "react-router-dom";
import { initializeMobileMenu } from "../components/mobileMenu";
import "../styles/AddUserForm.css";
import { useTranslation } from "react-i18next";

function EditUserForm() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { username } = useParams();
    const userData = JSON.parse(localStorage.getItem("userInfo")) || {};
    const [token, setToken] = useState("");
    const [municipalities, setMunicipalities] = useState([]);
    const [selectedMunicipalityId, setSelectedMunicipalityId] = useState("");
    const [fileError, setFileError] = useState(false);
    const [fileName, setFileName] = useState(t("editUserForm.noFileSelected"));
    const [fileSizeError, setFileSizeError] = useState(false);

    useEffect(() => {
        const retrievedToken = localStorage.getItem("jwtToken");
        setToken(retrievedToken);
    }, []);

    const [formData, setFormData] = useState({
        username: "",
        name: "",
        surname: "",
        role: "ROLE_USER",
        status: "ACTIVE",
        password: "",
        file: null,
    });

    const roles = ["ROLE_ADMIN", "ROLE_PRESIDENT", "ROLE_USER", "ROLE_SPECTATOR", "ROLE_PRESENTER"];
    const statuses = ["ACTIVE", "INACTIVE"];

    useEffect(() => {
        const cleanupMobileMenu = initializeMobileMenu();
        return () => {
            cleanupMobileMenu();
        };
    }, [navigate]);

    useEffect(() => {
        const fetchMunicipalities = async () => {
            try {
                const response = await fetch(process.env.REACT_APP_API_URL + "/api/municipalities/simple", {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (response.ok) {
                    const data = await response.json();
                    setMunicipalities(data);
                } else {
                    console.error("Failed to fetch municipalities");
                }
            } catch (error) {
                console.error("Error fetching municipalities:", error);
            }
        };

        if (token) {
            fetchMunicipalities();
        }
    }, [token]);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/user/${username}`, {
                    method: "GET",
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (response.ok) {
                    const user = await response.json();
                    setFormData({
                        username: user.username || "",
                        name: user.name || "",
                        surname: user.surname || "",
                        role: user.role || "ROLE_USER",
                        status: user.status || "ACTIVE",
                        password: "",
                    });
                    setSelectedMunicipalityId(user.municipalityId || "");
                } else {
                    console.error("Failed to fetch user data");
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
            }
        };

        if (token) {
            fetchUserData();
        }
    }, [username, token]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (fileError || fileSizeError) return;

        const submissionData = new FormData();
        submissionData.append("name", formData.name);
        submissionData.append("surname", formData.surname);
        submissionData.append("role", formData.role);
        submissionData.append("status", formData.status);
        submissionData.append("municipalityId", selectedMunicipalityId);

        if (formData.password) {
            submissionData.append("password", formData.password.trim());
        }
        if (formData.file) {
            submissionData.append("file", formData.file);
        }

        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/update/${username}`, {
                method: "PUT",
                headers: { Authorization: `Bearer ${token}` },
                body: submissionData,
            });

            if (response.ok) {
                navigate("/admin-panel");
            } else {
                console.error("Failed to update user");
            }
        } catch (error) {
            console.error("Error submitting form:", error);
        }
    };

    const handleMunicipalityChange = (e) => {
        setSelectedMunicipalityId(e.target.value);
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            const validTypes = ["image/jpeg", "image/png"];
            if (!validTypes.includes(selectedFile.type)) {
                setFileError(true);
                setFileSizeError(false);
                setFileName(t("editUserForm.noFileSelected"));
                return;
            }

            if (selectedFile.size > 51200) {
                setFileSizeError(true);
                setFileError(false);
                setFileName(t("editUserForm.noFileSelected"));
            } else {
                setFormData({ ...formData, file: selectedFile });
                setFileError(false);
                setFileSizeError(false);
                setFileName(selectedFile.name);
            }
        } else {
            setFileName(t("editUserForm.noFileSelected"));
        }
    };

    return (
        <div className="add-user-form-container">
            <HelmetProvider>
                <Helmet>
                    <title>{t("editUserForm.pageTitle")}</title>
                </Helmet>
            </HelmetProvider>
            <Header userInfo={userData} />

            <div className="container mt-5 pb-5">
                <div className="add-user-form-body">
                    <div className="form-wrapper">
                        <h1 className="text-center">{t("editUserForm.formTitle")}</h1>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="label-add">{t("editUserForm.username")}</label>
                                <input
                                    type="text"
                                    className="form-control form-control-lg mb-2"
                                    id="username"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleInputChange}
                                    required
                                    disabled
                                    placeholder={t("editUserForm.enterUsername")}
                                />
                            </div>

                            <div className="form-group">
                                <label className="label-add">{t("editUserForm.name")}</label>
                                <input
                                    type="text"
                                    className="form-control form-control-lg mb-2"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                    placeholder={t("editUserForm.enterName")}
                                />
                            </div>

                            <div className="form-group">
                                <label className="label-add">{t("editUserForm.surname")}</label>
                                <input
                                    type="text"
                                    className="form-control form-control-lg mb-2"
                                    id="surname"
                                    name="surname"
                                    value={formData.surname}
                                    onChange={handleInputChange}
                                    required
                                    placeholder={t("editUserForm.enterSurname")}
                                />
                            </div>

                            <div className="form-group mb-2">
                                <label className="label-add">{t("editUserForm.role")}</label>
                                <select
                                    id="role"
                                    name="role"
                                    className="form-control form-control-lg mb-2"
                                    value={formData.role}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="" disabled>{t("editUserForm.selectRole")}</option>
                                    {roles.map((role) => (
                                        <option key={role} value={role}>{role}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group mb-2">
                                <label className="label-add">{t("editUserForm.status")}</label>
                                <select
                                    id="status"
                                    name="status"
                                    className="form-control form-control-lg mb-2"
                                    value={formData.status}
                                    onChange={handleInputChange}
                                    required
                                >
                                    {statuses.map((status) => (
                                        <option key={status} value={status}>{status}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="label-add">{t("editUserForm.municipality")}</label>
                                <select
                                    className="form-control form-control-lg mb-2"
                                    id="municipality"
                                    name="municipality"
                                    value={selectedMunicipalityId}
                                    onChange={handleMunicipalityChange}
                                >
                                    <option value="">{t("editUserForm.selectMunicipality")}</option>
                                    {municipalities.map((municipality) => (
                                        <option key={municipality.id} value={municipality.id}>
                                            {municipality.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="label-add">{t("editUserForm.password")}</label>
                                <input
                                    type="text"
                                    className="form-control form-control-lg mb-2"
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    placeholder={t("editUserForm.enterNewPassword")}
                                />
                            </div>

                            <div className="form-group d-flex justify-content-center">
                                <div className={`file-drop-area image-add-input ${fileError ? "is-active" : ""}`}>
                                    <p className="file-drop-message text-info-image-input">
                                        {formData.file
                                            ? `${t("editUserForm.selectedFile")}: ${fileName}`
                                            : <>{t("editUserForm.dragOrClick")} <span>{t("editUserForm.chooseFile")}</span></>
                                        }
                                    </p>
                                    <input type="file" id="file" name="file" onChange={handleFileChange} />
                                </div>
                            </div>
                            {fileError && <div className="error-message">{t("editUserForm.invalidFileType")}</div>}
                            {fileSizeError && <div className="error-message">{t("editUserForm.fileTooLarge")}</div>}

                            <div className="form-group d-flex justify-content-between mt-4">
                                <button type="submit" className="btn btn-lg btn-warning">{t("editUserForm.editUser")}</button>
                                <button type="button" className="btn btn-lg btn-danger" onClick={() => navigate("/admin-panel")}>{t("editUserForm.cancel")}</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default EditUserForm;
