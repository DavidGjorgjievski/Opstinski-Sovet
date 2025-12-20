import React, { useEffect, useState } from 'react';
import { Link } from "react-router-dom";
import Header from '../components/Header';
import '../styles/ChangeImage.css'; 
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { initializeMobileMenu } from '../components/mobileMenu';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faUpload } from "@fortawesome/free-solid-svg-icons";
import api from '../api/axios'; // Axios instance with JWT handling

const ChangeImage = () => {
    const { t } = useTranslation();
    const [file, setFile] = useState(null);
    const [fileName, setFileName] = useState('');
    const [errorKey, setErrorKey] = useState(null);
    const [successKey, setSuccessKey] = useState(null);
    const [fileSizeError, setFileSizeError] = useState(false);

    const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};

    useEffect(() => {
        setFileName(t('changeImage.noFileSelected'));
        const cleanupMobileMenu = initializeMobileMenu();
        return () => cleanupMobileMenu();
    }, [t]);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            const validTypes = ['image/jpeg', 'image/png'];
            if (!validTypes.includes(selectedFile.type)) {
                setErrorKey('changeImage.invalidType');
                setFile(null);
                setFileName(t('changeImage.noFileSelected'));
                return;
            }

            if (selectedFile.size > 51200) { // 50KB limit
                setFileSizeError(true);
                setFile(null);
                setFileName(t('changeImage.noFileSelected'));
            } else {
                setFile(selectedFile);
                setFileName(selectedFile.name);
                setFileSizeError(false);
                setErrorKey(null);
            }
        } else {
            setFileName(t('changeImage.noFileSelected'));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorKey(null);
        setSuccessKey(null);

        if (!file) {
            setErrorKey('changeImage.selectFile');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        try {
            // Send file using Axios
            await api.post("/api/change-image", formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            // Convert file to base64 and store in localStorage
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result.split(',')[1];
                const updatedUserInfo = { ...userInfo, image: base64String };
                localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
                setSuccessKey('changeImage.uploadSuccess');
            };
            reader.readAsDataURL(file);

        } catch (error) {
            console.error('Error uploading image:', error);
            setErrorKey('changeImage.uploadError');
        }
    };

    return (
        <div className="change-image-container">
            <HelmetProvider>
                <Helmet>
                    <title>{t('changeImage.title')}</title>
                </Helmet>
            </HelmetProvider>
            <Header userInfo={userInfo} />

            <main>
                <div className='change-image-body-container'>
                    <div className="card-header text-center">
                        <h2>{t('changeImage.header')}</h2>
                    </div>

                    <div className="card-body">
                        <form onSubmit={handleSubmit} className="image-change-form">
                            <div className="file-drop-area-image">
                                <p className="file-drop-message-image">
                                    {file ? (
                                        `${t('changeImage.selectedFile')}: ${fileName}` 
                                    ) : (
                                        <>
                                            {t('changeImage.dragOrClick')} <span>{t('changeImage.clickHere')}</span>
                                        </>
                                    )}
                                </p>
                                <input type="file" onChange={handleFileChange} required />
                            </div>

                            {fileSizeError && <p className="error-message">{t('changeImage.sizeLimit')}</p>}
                            {errorKey && <p className="error-message">{t(errorKey)}</p>}
                            {successKey && <p className="success-message">{t(successKey)}</p>}

                            <div className="d-flex flex-row mt-2">
                                <button type="submit" className="button-change-image-submit me-2">
                                    {t('changeImage.uploadButton')} <FontAwesomeIcon icon={faUpload} />
                                </button>
                                <Link to="/profile" className="button-change-image-back">
                                    <FontAwesomeIcon icon={faChevronLeft} /> {t('changeImage.backButton')}
                                </Link>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ChangeImage;
