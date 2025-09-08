import React, { useState, useEffect } from "react";
import { Helmet, HelmetProvider } from "react-helmet-async";
import Header from "../components/Header";
import { useNavigate } from "react-router-dom";
import { initializeMobileMenu } from "../components/mobileMenu";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import "../styles/AddUserForm.css";

function AddUserForm() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const userData = JSON.parse(localStorage.getItem("userInfo")) || {};
    const [token, setToken] = useState("");
    const [municipalities, setMunicipalities] = useState([]);
    const [selectedMunicipalityId, setSelectedMunicipalityId] = useState("");

    const [formData, setFormData] = useState({
        username: "",
        name: "",
        surname: "",
        password: "",
        role: "ROLE_USER",
        status: "ACTIVE",
        file: null,
    });

    const [confirmPassword, setConfirmPassword] = useState("");
    const [fileError, setFileError] = useState(false);
    const [passwordError, setPasswordError] = useState(false);
    const [fileName, setFileName] = useState(t("addUserForm.noFileSelected"));
    const [fileSizeError, setFileSizeError] = useState(false);
    const roles = ["ROLE_ADMIN", "ROLE_PRESIDENT", "ROLE_USER", "ROLE_SPECTATOR", "ROLE_PRESENTER", "ROLE_GUEST"];
    const statuses = ["ACTIVE", "INACTIVE"];

    const [showPassword, setShowPassword] = useState(true);
    const [showConfirmPassword, setShowConfirmPassword] = useState(true);

    useEffect(() => {
        const retrievedToken = localStorage.getItem("jwtToken");
        setToken(retrievedToken);
    }, []);

    useEffect(() => {
        const fetchMunicipalities = async () => {
            try {
                const response = await fetch(process.env.REACT_APP_API_URL + "/api/municipalities/simple", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (response.ok) {
                    const data = await response.json();
                    setMunicipalities(data);
                }
            } catch (error) {
                console.error("Error fetching municipalities:", error);
            }
        };
        if (token) {
            fetchMunicipalities();
        }
    }, [token]);

    const handleMunicipalityChange = (e) => {
        setSelectedMunicipalityId(e.target.value);
    };

    useEffect(() => {
        const cleanupMobileMenu = initializeMobileMenu();
        return () => cleanupMobileMenu();
    }, [navigate]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name === "confirmPassword") {
            setConfirmPassword(value);
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            const validTypes = ["image/jpeg", "image/png"];
            if (!validTypes.includes(selectedFile.type)) {
                setFileError(true);
                setFileSizeError(false);
                setFileName(t("addUserForm.noFileSelected"));
                return;
            }

            if (selectedFile.size > 51200) {
                setFileSizeError(true);
                setFileError(false);
                setFileName(t("addUserForm.noFileSelected"));
            } else {
                setFormData({ ...formData, file: selectedFile });
                setFileError(false);
                setFileSizeError(false);
                setFileName(selectedFile.name);
            }
        } else {
            setFileName(t("addUserForm.noFileSelected"));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const trimmedUsername = formData.username.trim().toLowerCase();
        const trimmedPassword = formData.password.trim();

        if (formData.password !== confirmPassword) {
            setPasswordError(true);
            return;
        }
        if (fileError || fileSizeError) return;

        setPasswordError(false);

        const submissionData = new FormData();
        submissionData.append("username", trimmedUsername);
        submissionData.append("name", formData.name);
        submissionData.append("surname", formData.surname);
        submissionData.append("password", trimmedPassword);
        submissionData.append("role", formData.role);
        submissionData.append("status", formData.status);
        if (formData.file) {
            submissionData.append("file", formData.file);
        }
        if (selectedMunicipalityId) {
            submissionData.append("municipalityId", selectedMunicipalityId);
        }

        try {
            const response = await fetch(process.env.REACT_APP_API_URL + "/api/admin/add", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: submissionData,
            });

            if (response.ok) {
                navigate("/admin-panel");
            } else {
                const errorMessage = await response.text();
                alert(errorMessage);
            }
        } catch (error) {
            console.error("Error submitting form:", error);
        }
    };

    return (
        <div className="add-user-form-container">
            <HelmetProvider>
                <Helmet>
                    <title>{t("addUserForm.pageTitle")}</title>
                </Helmet>
            </HelmetProvider>
            <Header userInfo={userData} />

            <div className="container mt-5 pb-5">
                <div className="add-user-form-body">
                    <div className="form-wrapper">
                        <h1 className="text-center">{t("addUserForm.formTitle")}</h1>
                        <form onSubmit={handleSubmit} encType="multipart/form-data">
                            <div className="form-group">
                                <label htmlFor="username" className="label-add">{t("addUserForm.username")}</label>
                                <input
                                    type="text"
                                    className="form-control form-control-lg mb-2"
                                    id="username"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleInputChange}
                                    required
                                    placeholder={t("addUserForm.enterUsername")}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="name" className="label-add">{t("addUserForm.name")}</label>
                                <input
                                    type="text"
                                    className="form-control form-control-lg mb-2"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                    placeholder={t("addUserForm.enterName")}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="surname" className="label-add">{t("addUserForm.surname")}</label>
                                <input
                                    type="text"
                                    className="form-control form-control-lg mb-2"
                                    id="surname"
                                    name="surname"
                                    value={formData.surname}
                                    onChange={handleInputChange}
                                    required
                                    placeholder={t("addUserForm.enterSurname")}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="password" className="label-add">{t("addUserForm.password")}</label>
                                <div className="d-flex flex-row">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        className="form-control form-control-lg mb-2"
                                        id="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        required
                                        placeholder={t("addUserForm.enterPassword")}
                                    />
                                    <FontAwesomeIcon
                                        icon={showPassword ? faEyeSlash : faEye}
                                        className="eye-icon"
                                        onClick={() => setShowPassword(!showPassword)}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label htmlFor="confirmPassword" className="label-add">{t("addUserForm.confirmPassword")}</label>
                                <div className="d-flex flex-row justify-content-center">
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        className="form-control form-control-lg mb-2"
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleInputChange}
                                        required
                                        placeholder={t("addUserForm.confirmPasswordPlaceholder")}
                                    />
                                    <FontAwesomeIcon
                                        icon={showConfirmPassword ? faEyeSlash : faEye}
                                        className="eye-icon"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    />
                                </div>
                            </div>

                            <div className="form-group mb-2">
                                <label htmlFor="role" className="label-add">{t("addUserForm.role")}</label>
                                <select
                                    id="role"
                                    name="role"
                                    className="form-control form-control-lg mb-2"
                                    value={formData.role}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="" disabled>{t("addUserForm.selectRole")}</option>
                                    {roles.map((role) => (
                                        <option key={role} value={role}>{role}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group mb-2">
                                <label htmlFor="status" className="label-add">{t("addUserForm.status")}</label>
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
                                <label htmlFor="municipality" className="label-add">{t("addUserForm.municipality")}</label>
                                <select
                                    className="form-control form-control-lg mb-2"
                                    id="municipality"
                                    name="municipality"
                                    value={selectedMunicipalityId}
                                    onChange={handleMunicipalityChange}
                                >
                                    <option value="">{t("addUserForm.selectMunicipality")}</option>
                                    {municipalities.map((municipality) => (
                                        <option key={municipality.id} value={municipality.id}>
                                            {municipality.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group d-flex justify-content-center">
                                <div className={`file-drop-area image-add-input ${fileError ? "is-active" : ""}`}>
                                    <p className="file-drop-message text-info-image-input">
                                        {formData.file ? `${t("addUserForm.selectedFile")}: ${fileName}` : (
                                            <>
                                                {t("addUserForm.dragOrClick")} <span>{t("addUserForm.chooseFile")}</span>
                                            </>
                                        )}
                                    </p>
                                    <input type="file" id="file" name="file" onChange={handleFileChange} required />
                                </div>
                            </div>
                            {fileError && (
                                <div className="error-message">{t("addUserForm.invalidFileType")}</div>
                            )}
                            {fileSizeError && (
                                <div className="error-message">{t("addUserForm.fileTooLarge")}</div>
                            )}
                            {passwordError && (
                                <div className="error-message">{t("addUserForm.passwordMismatch")}</div>
                            )}

                            <div className="form-group d-flex justify-content-between mt-2">
                                <button type="submit" className="btn btn-md btn-primary action-buttons">
                                    {t("addUserForm.addUser")}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-danger btn-md action-buttons"
                                    onClick={() => navigate("/admin-panel")}
                                >
                                    {t("addUserForm.back")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AddUserForm;
