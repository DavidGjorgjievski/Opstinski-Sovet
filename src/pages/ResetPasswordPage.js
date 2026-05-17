import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import "../styles/ResetPassword.css";

function ResetPasswordPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const token = searchParams.get("token"); // Get token from URL
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // eslint-disable-next-line no-control-regex
    const PASSWORD_REGEX = /^[^\x00-\x1F\x7F'"\\`]+$/;

    const validatePassword = (value) => {
        if (value.length > 0 && new TextEncoder().encode(value).length > 72) return t("passwordValidation.tooLong");
        if (value.length > 0 && !PASSWORD_REGEX.test(value)) return t("passwordValidation.invalidChars");
        return "";
    };

    const handlePasswordChange = (e) => {
        const val = e.target.value;
        setPassword(val);
        setPasswordError(validatePassword(val));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        setError("");

        const pwErr = validatePassword(password);
        if (pwErr) { setPasswordError(pwErr); return; }

        if (password !== confirmPassword) {
            setError(t("reset.passwordsDoNotMatch"));
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/reset-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, newPassword: password }),
            });

            if (!response.ok) {
                setError(t("reset.error"));
                return;
            }

            setMessage(t("reset.success"));
            setPassword("");
            setConfirmPassword("");

            // Redirect to login after 2 seconds
            setTimeout(() => navigate("/login"), 2000);
        } catch (err) {
            console.error(err);
            setError(t("reset.error"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="rp-wrapper">
            <div className="rp-box">
                <h2 className="rp-title">{t("reset.title")}</h2>

                {message && <div className="rp-success">{message}</div>}
                {error && <div className="rp-error">{error}</div>}
                {passwordError && <div className="rp-error">{passwordError}</div>}

                <form onSubmit={handleSubmit} className="rp-form">
                    <div className="rp-password-wrapper">
                        <input
                            type={showPassword ? "text" : "password"}
                            className="rp-input"
                            placeholder={t("reset.newPassword")}
                            value={password}
                            onChange={handlePasswordChange}
                            required
                        />
                        <FontAwesomeIcon
                            icon={showPassword ? faEyeSlash : faEye}
                            className="rp-eye-icon"
                            onClick={() => setShowPassword(!showPassword)}
                        />
                    </div>
                    <div className="rp-password-wrapper">
                        <input
                            type={showConfirmPassword ? "text" : "password"}
                            className="rp-input"
                            placeholder={t("reset.confirmPassword")}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                        <FontAwesomeIcon
                            icon={showConfirmPassword ? faEyeSlash : faEye}
                            className="rp-eye-icon"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        />
                    </div>

                    <button className="login-button" disabled={loading}>
                        {loading ? t("reset.sending") : t("reset.submitButton")}
                    </button>
                </form>

                <button className="guest-button" onClick={() => navigate("/login")}>
                    {t("common.backToLogin")}
                </button>
            </div>
        </div>
    );
}

export default ResetPasswordPage;
