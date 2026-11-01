import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Helmet, HelmetProvider } from "react-helmet-async";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faArrowLeft,
    faCircleCheck,
    faCircleExclamation,
    faEye,
    faEyeSlash,
    faKey,
    faLock
} from "@fortawesome/free-solid-svg-icons";
import AuthLayout from "../components/AuthLayout";

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

            if (response.status === 429) {
                setError(t("common.tooManyRequests"));
                return;
            }

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                setError(data.code === "INVALID_TOKEN" ? t("reset.invalidLink") : t("reset.error"));
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

    const alerts = [error, passwordError].filter(Boolean);

    return (
        <AuthLayout>
            <HelmetProvider>
                <Helmet><title>{`${t("reset.title")} | ${t("login.councilName")}`}</title></Helmet>
            </HelmetProvider>

            <div className="login-container">
                <h1 className="login-heading">{t("reset.title")}</h1>
                <p className="login-subtitle">{t("reset.subtitle")}</p>

                {message && (
                    <div className="login-success" role="status">
                        <FontAwesomeIcon icon={faCircleCheck} />
                        <span>{message}</span>
                    </div>
                )}
                {alerts.map((alert) => (
                    <div className="login-error" role="alert" key={alert}>
                        <FontAwesomeIcon icon={faCircleExclamation} />
                        <span>{alert}</span>
                    </div>
                ))}

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="login-field">
                        <label htmlFor="reset-password">{t("reset.newPassword")}</label>
                        <div className="login-input-wrapper">
                            <FontAwesomeIcon icon={faLock} className="login-input-icon" />
                            <input
                                id="reset-password"
                                type={showPassword ? "text" : "password"}
                                name="newPassword"
                                className="login-input-field login-input-password"
                                autoComplete="new-password"
                                value={password}
                                onChange={handlePasswordChange}
                                required
                            />
                            <button
                                type="button"
                                className="login-eye-button"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={showPassword ? t("login.hidePassword") : t("login.showPassword")}
                                aria-pressed={showPassword}
                            >
                                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                            </button>
                        </div>
                    </div>

                    <div className="login-field">
                        <label htmlFor="reset-confirm-password">{t("reset.confirmPassword")}</label>
                        <div className="login-input-wrapper">
                            <FontAwesomeIcon icon={faLock} className="login-input-icon" />
                            <input
                                id="reset-confirm-password"
                                type={showConfirmPassword ? "text" : "password"}
                                name="confirmPassword"
                                className="login-input-field login-input-password"
                                autoComplete="new-password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                className="login-eye-button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                aria-label={showConfirmPassword ? t("login.hidePassword") : t("login.showPassword")}
                                aria-pressed={showConfirmPassword}
                            >
                                <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} />
                            </button>
                        </div>
                    </div>

                    <button type="submit" className="login-submit" disabled={loading}>
                        {loading ? (
                            <>
                                <span className="login-spinner" aria-hidden="true" />
                                {t("reset.sending")}
                            </>
                        ) : (
                            <>
                                {t("reset.submitButton")}
                                <FontAwesomeIcon icon={faKey} />
                            </>
                        )}
                    </button>
                </form>

                <Link to="/login" className="login-guest login-back">
                    <FontAwesomeIcon icon={faArrowLeft} />
                    {t("common.backToLogin")}
                </Link>
            </div>
        </AuthLayout>
    );
}

export default ResetPasswordPage;
