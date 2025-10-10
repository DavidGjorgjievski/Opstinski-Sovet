import React, { useState, useEffect, useRef } from "react";
import { Helmet, HelmetProvider } from "react-helmet-async";
import Header from "../components/Header";
import { useNavigate } from "react-router-dom";
import { initializeMobileMenu } from "../components/mobileMenu";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash, faUserPlus, faChevronLeft } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import "../styles/AddUserForm.css";

function AddUserForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const userData = JSON.parse(localStorage.getItem("userInfo")) || {};
  const [token, setToken] = useState("");
  const [municipalities, setMunicipalities] = useState([]);

  const [formData, setFormData] = useState({
    username: "",
    name: "",
    surname: "",
    password: "",
    role: "ROLE_USER",
    status: "ACTIVE",
    municipalityId: "",
    file: null,
  });

  const [confirmPassword, setConfirmPassword] = useState("");
  const [fileError, setFileError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [fileName, setFileName] = useState(t("addUserForm.noFileSelected"));
  const [fileSizeError, setFileSizeError] = useState(false);
  const [showPassword, setShowPassword] = useState(true);
  const [showConfirmPassword, setShowConfirmPassword] = useState(true);

  // Dropdown control
  const [openRole, setOpenRole] = useState(false);
  const [openStatus, setOpenStatus] = useState(false);
  const [openMunicipality, setOpenMunicipality] = useState(false);

  const roleRef = useRef(null);
  const statusRef = useRef(null);
  const municipalityRef = useRef(null);

  const roles = [
    "ROLE_ADMIN",
    "ROLE_PRESIDENT",
    "ROLE_USER",
    "ROLE_SPECTATOR",
    "ROLE_PRESENTER",
    "ROLE_GUEST",
  ];
  const statuses = ["ACTIVE", "INACTIVE"];

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
    if (token) fetchMunicipalities();
  }, [token]);

  useEffect(() => {
    const cleanupMobileMenu = initializeMobileMenu();
    return () => cleanupMobileMenu();
  }, [navigate]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (roleRef.current && !roleRef.current.contains(e.target)) setOpenRole(false);
      if (statusRef.current && !statusRef.current.contains(e.target)) setOpenStatus(false);
      if (municipalityRef.current && !municipalityRef.current.contains(e.target)) setOpenMunicipality(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    if (formData.file) submissionData.append("file", formData.file);
    if (formData.municipalityId) submissionData.append("municipalityId", formData.municipalityId);

    try {
      const response = await fetch(process.env.REACT_APP_API_URL + "/api/admin/add", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: submissionData,
      });

      if (response.ok) navigate("/admin-panel");
      else alert(await response.text());
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  return (
    <HelmetProvider>
      <div className="add-user-form-container">
        <Helmet>
          <title>{t("addUserForm.pageTitle")}</title>
        </Helmet>

        <Header userInfo={userData} isSticky={true} />

        <div className="add-user-form-body-container container">
          <div className="add-user-header-div container">
            <h1 className="text-center">{t("addUserForm.formTitle")}</h1>
            <form onSubmit={handleSubmit} encType="multipart/form-data">
              {/* Username, Name, Surname */}
              <label htmlFor="username" className="label-add">{t("addUserForm.username")}</label>
              <input
                type="text"
                name="username"
                className="add-user-input-field mb-2"
                placeholder={t("addUserForm.enterUsername")}
                value={formData.username}
                onChange={handleInputChange}
                required
              />
              <label htmlFor="name" className="label-add">{t("addUserForm.name")}</label>
              <input
                type="text"
                name="name"
                className="add-user-input-field mb-2"
                placeholder={t("addUserForm.enterName")}
                value={formData.name}
                onChange={handleInputChange}
                required
              />
               <label htmlFor="surname" className="label-add">{t("addUserForm.surname")}</label>
              <input
                type="text"
                name="surname"
                className="add-user-input-field mb-2"
                placeholder={t("addUserForm.enterSurname")}
                value={formData.surname}
                onChange={handleInputChange}
                required
              />

              {/* Passwords */}
              <label htmlFor="password" className="label-add">{t("addUserForm.password")}</label>
              <div className="d-flex flex-row">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  className="add-user-input-field mb-2"
                  placeholder={t("addUserForm.enterPassword")}
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
                <FontAwesomeIcon
                  icon={showPassword ? faEyeSlash : faEye}
                  className="eye-icon"
                  onClick={() => setShowPassword(!showPassword)}
                />
              </div>

              <label htmlFor="confirmPassword" className="label-add">{t("addUserForm.confirmPassword")}</label>
              <div className="d-flex flex-row">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  className="add-user-input-field mb-2"
                  placeholder={t("addUserForm.confirmPasswordPlaceholder")}
                  value={confirmPassword}
                  onChange={handleInputChange}
                  required
                />
                <FontAwesomeIcon
                  icon={showConfirmPassword ? faEyeSlash : faEye}
                  className="eye-icon"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                />
              </div>

              {/* Custom Dropdowns */}
              {/* Role */}
              <div className="topic-status-select-wrapper mt-3" ref={roleRef}>
                <label className="label-add">{t("addUserForm.role")}</label>
                <div
                  className="custom-select-box"
                  onClick={() => setOpenRole(!openRole)}
                >
                  {formData.role || t("addUserForm.selectRole")}
                </div>
                {openRole && (
                  <div className="custom-options">
                    {roles.map((role) => (
                      <div
                        key={role}
                        className={`custom-option ${formData.role === role ? "selected" : ""}`}
                        onClick={() => {
                          setFormData({ ...formData, role });
                          setOpenRole(false);
                        }}
                      >
                        {role}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Status */}
              <div className="topic-status-select-wrapper mt-3" ref={statusRef}>
                <label className="label-add">{t("addUserForm.status")}</label>
                <div
                  className="custom-select-box"
                  onClick={() => setOpenStatus(!openStatus)}
                >
                  {formData.status || t("addUserForm.selectStatus")}
                </div>
                {openStatus && (
                  <div className="custom-options">
                    {statuses.map((status) => (
                      <div
                        key={status}
                        className={`custom-option ${formData.status === status ? "selected" : ""}`}
                        onClick={() => {
                          setFormData({ ...formData, status });
                          setOpenStatus(false);
                        }}
                      >
                        {status}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Municipality */}
              <div className="topic-status-select-wrapper mt-3" ref={municipalityRef}>
                <label className="label-add">{t("addUserForm.municipality")}</label>
                <div
                  className="custom-select-box"
                  onClick={() => setOpenMunicipality(!openMunicipality)}
                >
                  {municipalities.find((m) => m.id === formData.municipalityId)?.name ||
                    t("addUserForm.selectMunicipality")}
                </div>
                {openMunicipality && (
                  <div className="custom-options">
                    {municipalities.map((m) => (
                      <div
                        key={m.id}
                        className={`custom-option ${formData.municipalityId === m.id ? "selected" : ""}`}
                        onClick={() => {
                          setFormData({ ...formData, municipalityId: m.id });
                          setOpenMunicipality(false);
                        }}
                      >
                        {m.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* File Upload */}
              <div className="form-group d-flex justify-content-center mt-4">
                <div className={`file-drop-area image-add-input ${fileError ? "is-active" : ""}`}>
                  <p className="file-drop-message text-info-image-input">
                    {formData.file
                      ? `${t("addUserForm.selectedFile")}: ${fileName}`
                      : `${t("addUserForm.dragOrClick")} ${t("addUserForm.chooseFile")}`}
                  </p>
                  <input type="file" id="file" name="file" onChange={handleFileChange} required />
                </div>
              </div>

              {fileError && <div className="error-message">{t("addUserForm.invalidFileType")}</div>}
              {fileSizeError && <div className="error-message">{t("addUserForm.fileTooLarge")}</div>}
              {passwordError && <div className="error-message">{t("addUserForm.passwordMismatch")}</div>}

              {/* Buttons */}
              <div className="mt-4 d-flex">
                <button type="submit" className="me-2 user-form-submit-button">
                  {t("addUserForm.addUser")} <FontAwesomeIcon icon={faUserPlus} className="ms-2" />
                </button>
                <button
                  type="button"
                  className="user-form-back-button"
                  onClick={() => navigate("/admin-panel")}
                >
                  <FontAwesomeIcon icon={faChevronLeft} className="me-2" />
                  {t("addUserForm.back")}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </HelmetProvider>
  );
}

export default AddUserForm;
