import React, { useState, useEffect, useRef } from "react";
import { Helmet, HelmetProvider } from "react-helmet-async";
import Header from "../components/Header";
import { useNavigate, useParams } from "react-router-dom";
import { initializeMobileMenu } from "../components/mobileMenu";
import "../styles/AddUserForm.css";
import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserEdit, faChevronLeft } from "@fortawesome/free-solid-svg-icons";

function EditUserForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { username } = useParams();
  const userData = JSON.parse(localStorage.getItem("userInfo")) || {};
  const [token, setToken] = useState("");
  const [municipalities, setMunicipalities] = useState([]);
  const [fileError, setFileError] = useState(false);
  const [fileName, setFileName] = useState(t("editUserForm.noFileSelected"));
  const [fileSizeError, setFileSizeError] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    username: "",
    name: "",
    surname: "",
    role: "ROLE_USER",
    status: "ACTIVE",
    municipalityId: "",
    password: "",
    file: null,
  });

  // Dropdown open states
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
    "ROLE_MAYOR",
    "ROLE_EDITOR",
    "ROLE_PRESENTER",
  ];
  const statuses = ["ACTIVE", "INACTIVE"];

  useEffect(() => {
    const retrievedToken = localStorage.getItem("jwtToken");
    setToken(retrievedToken);
  }, []);

  useEffect(() => {
    const cleanupMobileMenu = initializeMobileMenu();
    return () => cleanupMobileMenu();
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
        }
      } catch (error) {
        console.error("Error fetching municipalities:", error);
      }
    };
    if (token) fetchMunicipalities();
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
            municipalityId: user.municipalityId || "",
            password: "",
          });
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    if (token) fetchUserData();
  }, [username, token]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (roleRef.current && !roleRef.current.contains(e.target)) setOpenRole(false);
      if (statusRef.current && !statusRef.current.contains(e.target)) setOpenStatus(false);
      if (municipalityRef.current && !municipalityRef.current.contains(e.target))
        setOpenMunicipality(false);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (fileError || fileSizeError) return;

    const submissionData = new FormData();
    submissionData.append("name", formData.name);
    submissionData.append("surname", formData.surname);
    submissionData.append("role", formData.role);
    submissionData.append("status", formData.status);
    if (formData.municipalityId)
      submissionData.append("municipalityId", formData.municipalityId);
    if (formData.password)
      submissionData.append("password", formData.password.trim());
    if (formData.file)
      submissionData.append("file", formData.file);

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/update/${username}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: submissionData,
      });

      if (response.ok) navigate("/admin-panel");
      else console.error("Failed to update user");
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  return (
    <HelmetProvider>
      <div className="add-user-form-container">
        <Helmet>
          <title>{t("editUserForm.pageTitle")}</title>
        </Helmet>

        <Header userInfo={userData} isSticky={true} />

        <div className="add-user-form-body-container container">
          <div className="add-user-header-div container">
            <h1 className="text-center">{t("editUserForm.formTitle")}</h1>

            <form onSubmit={handleSubmit} encType="multipart/form-data">
              {/* Username */}
              <label className="label-add">{t("editUserForm.username")}</label>
              <input
                type="text"
                className="add-user-input-field mb-2"
                name="username"
                value={formData.username}
                disabled
              />

              {/* Name */}
              <label className="label-add">{t("editUserForm.name")}</label>
              <input
                type="text"
                className="add-user-input-field mb-2"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />

              {/* Surname */}
              <label className="label-add">{t("editUserForm.surname")}</label>
              <input
                type="text"
                className="add-user-input-field mb-2"
                name="surname"
                value={formData.surname}
                onChange={handleInputChange}
                required
              />

              {/* Role dropdown */}
              <div className="topic-status-select-wrapper mt-3" ref={roleRef}>
                <label className="label-add">{t("editUserForm.role")}</label>
                <div
                  className="custom-select-box"
                  onClick={() => setOpenRole(!openRole)}
                >
                  {formData.role || t("editUserForm.selectRole")}
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

              {/* Status dropdown */}
              <div className="topic-status-select-wrapper mt-3" ref={statusRef}>
                <label className="label-add">{t("editUserForm.status")}</label>
                <div
                  className="custom-select-box"
                  onClick={() => setOpenStatus(!openStatus)}
                >
                  {formData.status || t("editUserForm.selectStatus")}
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

              {/* Municipality dropdown */}
              <div className="topic-status-select-wrapper mt-3" ref={municipalityRef}>
                <label className="label-add">{t("editUserForm.municipality")}</label>
                <div
                  className="custom-select-box"
                  onClick={() => setOpenMunicipality(!openMunicipality)}
                >
                  {municipalities.find((m) => m.id === formData.municipalityId)?.name ||
                    t("editUserForm.selectMunicipality")}
                </div>
                {openMunicipality && (
                  <div className="custom-options">
                    {municipalities.map((m) => (
                      <div
                        key={m.id}
                        className={`custom-option ${
                          formData.municipalityId === m.id ? "selected" : ""
                        }`}
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

              {/* Password */}
              <label className="label-add mt-3">{t("editUserForm.password")}</label>
              <input
                type="text"
                className="add-user-input-field mb-2"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder={t("editUserForm.enterNewPassword")}
              />

              {/* File upload */}
              <div className="form-group d-flex justify-content-center mt-4">
                <div className={`file-drop-area image-add-input ${fileError ? "is-active" : ""}`}>
                  <p className="file-drop-message text-info-image-input">
                    {formData.file
                      ? `${t("editUserForm.selectedFile")}: ${fileName}`
                      : `${t("editUserForm.dragOrClick")} ${t("editUserForm.chooseFile")}`}
                  </p>
                  <input type="file" name="file" onChange={handleFileChange} />
                </div>
              </div>

              {fileError && (
                <div className="error-message">{t("editUserForm.invalidFileType")}</div>
              )}
              {fileSizeError && (
                <div className="error-message">{t("editUserForm.fileTooLarge")}</div>
              )}

              {/* Buttons */}
              <div className="mt-4 d-flex">
                <button type="submit" className="me-2 user-form-submit-button">
                  {t("editUserForm.editUser")}
                  <FontAwesomeIcon icon={faUserEdit} className="ms-2" />
                </button>

                <button
                  type="button"
                  className="user-form-back-button"
                  onClick={() => navigate("/admin-panel")}
                >
                  <FontAwesomeIcon icon={faChevronLeft} className="me-2" />
                  {t("editUserForm.cancel")}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </HelmetProvider>
  );
}

export default EditUserForm;
