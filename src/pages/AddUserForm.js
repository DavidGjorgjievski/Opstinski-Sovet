import React, { useState, useEffect, useRef } from "react";
import { Helmet, HelmetProvider } from "react-helmet-async";
import Header from "../components/Header";
import { useNavigate, useParams } from "react-router-dom";
import { initializeMobileMenu } from "../components/mobileMenu";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash, faUserPlus, faChevronLeft } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import "../styles/AddUserForm.css";
import api from '../api/axios';

function AddUserForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [token, setToken] = useState("");
  const [municipalities, setMunicipalities] = useState([]);
  const { username } = useParams();
  const isEditMode = Boolean(username);

  const [formData, setFormData] = useState({
    username: "",
    name: "",
    surname: "",
    email: "",
    password: "",
    role: "ROLE_USER",
    status: "ACTIVE",
    municipalityId: "",
    file: null,
  });


  const [fileError, setFileError] = useState(false);
  const [fileName, setFileName] = useState(t("addUserForm.noFileSelected"));
  const [fileSizeError, setFileSizeError] = useState(false);
  const [showPassword, setShowPassword] = useState(true);

  // Dropdown control
  const [openRole, setOpenRole] = useState(false);
  const [openStatus, setOpenStatus] = useState(false);
  const [openMunicipality, setOpenMunicipality] = useState(false);

  const roleRef = useRef(null);
  const statusRef = useRef(null);
  const municipalityRef = useRef(null);

  const roles = React.useMemo(() => {
    const baseRoles = [
      "ROLE_ADMIN",
      "ROLE_PRESIDENT",
      "ROLE_USER",
      "ROLE_SPECTATOR",
      "ROLE_PRESENTER",
      "ROLE_MAYOR",
      "ROLE_EDITOR",
    ];
    return isEditMode ? baseRoles : [...baseRoles, "ROLE_GUEST"];
  }, [isEditMode]);


  const statuses = ["ACTIVE", "INACTIVE"];

  useEffect(() => {
    const retrievedToken = localStorage.getItem("jwtToken");
    setToken(retrievedToken);
  }, []);


    useEffect(() => {
    if (!isEditMode || !token) return;

    const fetchUserData = async () => {
      try {
        const { data: user } = await api.get(`/api/admin/user/${username}`);
        
        setFormData({
          username: user.username || "",
          name: user.name || "",
          surname: user.surname || "",
          email: user.email || "",
          role: user.role || "ROLE_USER",
          status: user.status || "ACTIVE",
          municipalityId: user.municipalityId || "",
          password: "", // always empty
          file: null,
        });

        setFileName(t("editUserForm.noFileSelected"));
      } catch (err) {
        console.error("Error fetching user data:", err);
      }
    };

    fetchUserData();
  }, [isEditMode, username, token, t]);

    useEffect(() => {
      if (!token) return;

      const fetchMunicipalities = async () => {
        try {
          const { data } = await api.get("/api/municipalities/simple");
          setMunicipalities(data);
        } catch (error) {
          console.error("Error fetching municipalities:", error);
        }
      };

      fetchMunicipalities();
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
    setFormData({ ...formData, [name]: value });
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
    if (fileError || fileSizeError) return;

    const submissionData = new FormData();
    if (!isEditMode) submissionData.append("username", formData.username.trim().toLowerCase());
    submissionData.append("name", formData.name);
    submissionData.append("surname", formData.surname);
    submissionData.append("email", formData.email);
    if (formData.password) submissionData.append("password", formData.password.trim());
    submissionData.append("role", formData.role);
    submissionData.append("status", formData.status);
    if (formData.municipalityId) submissionData.append("municipalityId", formData.municipalityId);
    if (formData.file) submissionData.append("file", formData.file);

    try {
      const url = isEditMode
        ? `/api/admin/update/${username}`
        : "/api/admin/add";

      await api({
        method: isEditMode ? "put" : "post",
        url,
        data: submissionData,
      });

      navigate("/admin-panel");
    } catch (err) {
      console.error("Error submitting form:", err);
    }
  };

  return (
    <HelmetProvider>
      <div className="add-user-form-container">
        <Helmet>
          <title>{isEditMode ? t("editUserForm.pageTitle") : t("addUserForm.pageTitle")}</title>
        </Helmet>

        <Header isSticky={true} />

        <div className="add-user-form-body-container container">
          <div className="add-user-header-div container">
            <h1 className="text-center">
              {isEditMode ? t("editUserForm.formTitle") : t("addUserForm.formTitle")}
            </h1>
            <form onSubmit={handleSubmit} encType="multipart/form-data">
              {/* Username, Name, Surname */}
              <label htmlFor="username" className="label-add">
                {t(isEditMode ? "editUserForm.username" : "addUserForm.username")}
              </label>
              <input
                type="text"
                name="username"
                className="add-user-input-field mb-2"
                placeholder={t(isEditMode ? "editUserForm.enterUsername" : "addUserForm.enterUsername")}
                value={formData.username}
                onChange={handleInputChange}
                required={!isEditMode} // optional: maybe disable editing username in edit mode
                disabled={isEditMode} // commonly usernames are not editable
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

              <label htmlFor="email" className="label-add">{t("addUserForm.email")}</label>
              <input
                type="email"
                name="email"
                className="add-user-input-field mb-2"
                placeholder={t("addUserForm.enterEmail")}
                value={formData.email}
                onChange={handleInputChange}
                required={false} 
              />

              <label htmlFor="password" className="label-add">
                {t("addUserForm.password")}
              </label>
              <div className="d-flex flex-row">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  className="add-user-input-field mb-2"
                  placeholder={t("addUserForm.enterPassword")}
                  value={formData.password}
                  onChange={handleInputChange}
                  required={!isEditMode} // required only if adding a new user
                />
                <FontAwesomeIcon
                  icon={showPassword ? faEyeSlash : faEye}
                  className="eye-icon"
                  onClick={() => setShowPassword(!showPassword)}
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
                    ? `${t(isEditMode ? "editUserForm.selectedFile" : "addUserForm.selectedFile")}: ${fileName}`
                    : `${t(isEditMode ? "editUserForm.dragOrClick" : "addUserForm.dragOrClick")} ${t(isEditMode ? "editUserForm.chooseFile" : "addUserForm.chooseFile")}`}
                </p>
                <input
                  type="file"
                  id="file"
                  name="file"
                  onChange={handleFileChange}
                  required={!isEditMode} 
                />
              </div>
            </div>

              {fileError && <div className="error-message">{t("addUserForm.invalidFileType")}</div>}
              {fileSizeError && <div className="error-message">{t("addUserForm.fileTooLarge")}</div>}

              {/* Buttons */}
              <div className="mt-4 d-flex">
                <button type="submit" className="me-2 user-form-submit-button">
                  {isEditMode ? t("editUserForm.editUser") : t("addUserForm.addUser")} 
                  <FontAwesomeIcon icon={faUserPlus} className="ms-2" />
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
