import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import '../styles/ChangeImage.css'; 
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { initializeMobileMenu } from '../components/mobileMenu';

const ChangeImage = () => {
    const [file, setFile] = useState(null);
    const [fileName, setFileName] = useState('Нема избрана слика');
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [fileSizeError, setFileSizeError] = useState(false);

    const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};
    const token = localStorage.getItem('jwtToken');

    useEffect(() => {
        const cleanupMobileMenu = initializeMobileMenu();

        return () => {
            cleanupMobileMenu();
        };
    }, []);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            const validTypes = ['image/jpeg', 'image/png']; // Allowed file types
            if (!validTypes.includes(selectedFile.type)) {
                setErrorMessage('Само JPG или PNG слики се дозволени.');
                setFile(null);
                setFileName('Нема избрана слика'); // Reset file name if invalid type
                return;
            }

            if (selectedFile.size > 51200) { // Validate file size (50KB limit)
                setFileSizeError(true);
                setFile(null);
                setFileName('Нема избрана слика'); // Reset file name if too large
            } else {
                setFile(selectedFile);
                setFileName(selectedFile.name); // Set file name when valid
                setFileSizeError(false);
                setErrorMessage(''); // Clear any previous error messages
            }
        } else {
            setFileName('Нема избрана слика'); // Reset file name if no file is selected
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        setErrorMessage('');
        setSuccessMessage('');
        
        if (!file) {
            setErrorMessage('Изберете слика за да продолжите.');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(process.env.REACT_APP_API_URL + '/api/change-image', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            if (response.status === 400) {
                const errorMsg = await response.text();
                setErrorMessage(errorMsg || 'Грешка при прикачување на сликата.');
                return;
            }

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

          // Convert image file to base64
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result.split(',')[1]; // Get the base64 string
            const updatedUserInfo = {
                ...userInfo,
                image: base64String // Update userInfo with the base64 string
            };

            localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
            setSuccessMessage('Сликата е успешно променета.');
        };
        reader.readAsDataURL(file); // Read the file as Data URL

    } catch (error) {
        console.error('Error uploading image:', error.message);
        setErrorMessage('Грешка при прикачување на сликата.');
    }
};

    return (
        <div className="change-image-container">
            <HelmetProvider>
                <Helmet>
                    <title>Промена на профилна</title>
                </Helmet>
            </HelmetProvider>
            <Header userInfo={userInfo} />

            <main>
                <div className='card image-form'>
                    <div className="card-header text-center">
                        <h2>Прикачи слика</h2>
                    </div>

                    <div className="card-body">
                        <form onSubmit={handleSubmit} className="image-change-form">
                            <div className="file-drop-area-image">
                                <p className="file-drop-message-image">
                                    {file ? (
                                    `Избрана датотека: ${fileName}` 
                                    ) : (
                                    <>Пуштете датотека тука или <span>кликнете за да изберете слика</span></>
                                    )}
                                </p>
                                <input type="file" onChange={handleFileChange} required />
                            </div>

                            {fileSizeError && <p className="error-message">Максималната големина на сликата е дозволено до 50KB!</p>}
                            {errorMessage && <p className="error-message">{errorMessage}</p>}
                            {successMessage && <p className="success-message">{successMessage}</p>}

                            <div className="d-flex flex-row mt-2">
                                <button type="submit" className="button-change-image-submit me-2">Прикачи</button>
                                <a type="button" className="button-change-image-back" href="/profile">Назад</a>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ChangeImage;
