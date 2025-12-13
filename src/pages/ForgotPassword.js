import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "../styles/ForgotPassword.css";

function ForgotPassword() {
    const { t } = useTranslation();
    const navigate = useNavigate();

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

            const data = await response.json();

            if (response.ok) {
                setMessage(data.message || t("forgot.success"));
            } else {
                setError(data.message || t("forgot.error"));
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
        <div className="fp-wrapper">
            <div className="fp-box">

                <h2 className="fp-title">{t("forgot.title")}</h2>

                {message && <div className="fp-success">{message}</div>}
                {error && <div className="fp-error">{error}</div>}

                <form onSubmit={handleSubmit} className="fp-form">

                    <input
                        type="email"
                        className="fp-input"
                        placeholder={t("forgot.emailPlaceholder")}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />

                    <button className="fp-submit" disabled={loading}>
                        {loading ? t("forgot.sending") : t("forgot.sendButton")}
                    </button>
                </form>

                <button className="fp-back" onClick={() => navigate("/login")}>
                    {t("forgot.backToLogin")}
                </button>

            </div>
        </div>
    );
}

export default ForgotPassword;
