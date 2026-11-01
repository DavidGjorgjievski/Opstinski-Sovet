import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Helmet, HelmetProvider } from "react-helmet-async";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faArrowLeft,
    faCircleCheck,
    faCircleExclamation,
    faEnvelope,
    faPaperPlane
} from "@fortawesome/free-solid-svg-icons";
import AuthLayout from "../components/AuthLayout";

function ForgotPassword() {
    const { t } = useTranslation();

    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

   const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");
        setError("");

        try {
            // Get selected language from localStorage, default to 'en'
            const selectedLanguage = localStorage.getItem("selectedLanguage") || "en";

            const response = await fetch(
                `${process.env.REACT_APP_API_URL}/api/forgot-password`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        email,
                        lang: selectedLanguage // <-- send language
                    }),
                }
            );

            if (response.ok) {
                setMessage(t("forgot.success"));
            } else if (response.status === 429) {
                setError(t("common.tooManyRequests"));
            } else {
                setError(t("forgot.error"));
            }

            setEmail("");
        } catch (err) {
            console.error(err);
            setError(t("forgot.error"));
        } finally {
            setLoading(false);
        }
    };


    return (
        <AuthLayout>
            <HelmetProvider>
                <Helmet><title>{`${t("forgot.title")} | ${t("login.councilName")}`}</title></Helmet>
            </HelmetProvider>

            <div className="login-container">
                <h1 className="login-heading">{t("forgot.title")}</h1>
                <p className="login-subtitle">{t("forgot.subtitle")}</p>

                {message && (
                    <div className="login-success" role="status">
                        <FontAwesomeIcon icon={faCircleCheck} />
                        <span>{message}</span>
                    </div>
                )}
                {error && (
                    <div className="login-error" role="alert">
                        <FontAwesomeIcon icon={faCircleExclamation} />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="login-field">
                        <label htmlFor="forgot-email">{t("forgot.emailPlaceholder")}</label>
                        <div className="login-input-wrapper">
                            <FontAwesomeIcon icon={faEnvelope} className="login-input-icon" />
                            <input
                                id="forgot-email"
                                type="email"
                                name="email"
                                className="login-input-field"
                                autoComplete="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className="login-submit" disabled={loading}>
                        {loading ? (
                            <>
                                <span className="login-spinner" aria-hidden="true" />
                                {t("forgot.sending")}
                            </>
                        ) : (
                            <>
                                {t("forgot.sendButton")}
                                <FontAwesomeIcon icon={faPaperPlane} />
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

export default ForgotPassword;
