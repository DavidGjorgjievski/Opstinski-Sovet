import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        setError("");

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

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || t("reset.error"));
                return;
            }

            setMessage(data.message || t("reset.success"));
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

                <form onSubmit={handleSubmit} className="rp-form">
                    <input
                        type="password"
                        className="rp-input"
                        placeholder={t("reset.newPassword")}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        className="rp-input"
                        placeholder={t("reset.confirmPassword")}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />

                    <button className="login-button" disabled={loading}>
                        {loading ? t("reset.sending") : t("reset.submitButton")}
                    </button>
                </form>

                <button className="guest-button" onClick={() => navigate("/login")}>
                    {t("reset.backToLogin")}
                </button>
            </div>
        </div>
    );
}

export default ResetPasswordPage;
