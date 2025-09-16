import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import Header from '../components/Header';
import { initializeMobileMenu } from '../components/mobileMenu';
import {
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileChange,
    handlePaste,
    MAX_FILE_SIZE_BYTES,
} from '../util/fileUpload';
import '../styles/AddTopicForm.css';
import useNewTopicWebSocket from "../hooks/useNewTopicWebSocket";
import { useTranslation } from "react-i18next";

const AddTopicForm = () => {
    const { id, idt, municipalityId } = useParams();
    const [title, setTitle] = useState('');
    const [file, setFile] = useState(null);
    const [pdfId, setPdfId] = useState(null);
    const [fileError, setFileError] = useState(false);
    const [fileTypeError, setFileTypeError] = useState(false); 
    const [currentPdfFileName, setCurrentPdfFileName] = useState(''); 
    const navigate = useNavigate();
    const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {}; 
    const isAddAfter = !!idt && window.location.pathname.includes('add-after');
    const isAddBefore = !!idt && window.location.pathname.includes('add-before');
    const [exportLoading, setExportLoading] = useState(false);
    const { t } = useTranslation();

    const { sendNewTopic } = useNewTopicWebSocket(id);

    const [topicStatus, setTopicStatus] = useState('');
   const topicStatusOptions = [
        { value: 'CREATED', label: t("addTopicForm.statusOptions.created") },
        { value: 'ACTIVE', label: t("addTopicForm.statusOptions.active") },
        { value: 'FINISHED', label: t("addTopicForm.statusOptions.finished") },
        { value: 'INFORMATION', label: t("addTopicForm.statusOptions.information") },
        { value: 'WITHDRAWN', label: t("addTopicForm.statusOptions.withdrawn") },
    ];

    // Fetch topic details if editing
    useEffect(() => {
        if (isAddAfter || isAddBefore) {
            setTopicStatus('CREATED'); 
            return; 
        }

        if (idt) {
            const fetchTopic = async () => {
                try {
                    const jwtToken = localStorage.getItem('jwtToken');
                    const response = await fetch(`${process.env.REACT_APP_API_URL}/api/sessions/${id}/topics/${idt}`, {
                        method: 'GET',
                        headers: { 'Authorization': `Bearer ${jwtToken}` },
                    });

                    if (response.ok) {
                        const topicData = await response.json();
                        setTitle(topicData.title);
                        setCurrentPdfFileName(topicData.pdfFileName);
                        setPdfId(topicData.pdfFileId);
                        setTopicStatus(topicData.topicStatus || 'CREATED');
                    } else {
                        console.error("Failed to fetch topic.");
                    }
                } catch (error) {
                    console.error("Error fetching the topic:", error);
                }
            };

            fetchTopic();
        } else {
            setTopicStatus('CREATED');
        }
    }, [idt, id, isAddAfter, isAddBefore]);

    const updateFileName = (fileName) => {
        const fileDropMessage = document.querySelector('.file-drop-message');
        if (fileDropMessage) fileDropMessage.textContent = fileName;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setExportLoading(true);

        const formData = new FormData();
        formData.append('title', title);
        formData.append('topicStatus', topicStatus);
        if (file) formData.append('file', file);

        const jwtToken = localStorage.getItem('jwtToken');

        try {
            let endpoint;
            if (isAddAfter) endpoint = `${process.env.REACT_APP_API_URL}/api/sessions/${id}/topics/add-after/${idt}`;
            else if (isAddBefore) endpoint = `${process.env.REACT_APP_API_URL}/api/sessions/${id}/topics/add-before/${idt}`;
            else if (idt) endpoint = `${process.env.REACT_APP_API_URL}/api/topics/edit/${idt}`;
            else endpoint = `${process.env.REACT_APP_API_URL}/api/sessions/${id}/topic/add`;

            // Always append municipalityId if adding
            if (!idt || isAddAfter || isAddBefore) formData.append('municipalityId', municipalityId);

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${jwtToken}` },
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                const topicId = data.topicId;
                sendNewTopic("NEW_TOPIC"); // Notify via WebSocket
                sessionStorage.removeItem('scrollPosition');
                navigate(`/municipalities/${municipalityId}/sessions/${id}/topics#topic-${topicId}`);
            } else {
                console.error("Failed to submit topic.");
            }
        } catch (error) {
            console.error("Error submitting the form:", error);
        } finally {
            setExportLoading(false);
        }
    };

    // Mobile menu initialization
    useEffect(() => initializeMobileMenu(), []);

    // File drop and paste listeners
    useEffect(() => {
        const fileDropArea = document.querySelector('.file-drop-area');
        if (!fileDropArea) return;

        const dragOverHandler = (e) => handleDragOver(e, fileDropArea);
        const dragLeaveHandler = () => handleDragLeave(fileDropArea);
        const dropHandler = (e) => handleDrop(e, document.getElementById('file'), updateFileName, setFileError, setFileTypeError);
        const pasteHandler = (e) => handlePaste(e, document.getElementById('file'), updateFileName, setFileError, setFileTypeError);

        fileDropArea.addEventListener('dragover', dragOverHandler);
        fileDropArea.addEventListener('dragleave', dragLeaveHandler);
        fileDropArea.addEventListener('drop', dropHandler);
        document.addEventListener('paste', pasteHandler);

        return () => {
            fileDropArea.removeEventListener('dragover', dragOverHandler);
            fileDropArea.removeEventListener('dragleave', dragLeaveHandler);
            fileDropArea.removeEventListener('drop', dropHandler);
            document.removeEventListener('paste', pasteHandler);
        };
    }, []);

    const handleFileInputChange = (e) => {
        const selectedFile = e.target.files[0];
        setFileError(false);
        setFileTypeError(false);

        if (!selectedFile) return;

        if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
            setFileError(true);
            updateFileName('');
            setFile(null);
            return;
        }

        if (selectedFile.type !== 'application/pdf') {
            setFileTypeError(true);
            updateFileName('');
            setFile(null);
            return;
        }

        handleFileChange(e, updateFileName, setFileError, setFileTypeError);
        setFile(selectedFile);
    };

    const handlePdfFetch = async (pdfId) => {
        const token = localStorage.getItem('jwtToken');
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/topics/pdf/${pdfId}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/pdf' },
            });
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                window.open(url, '_blank');
            } else {
                console.error('PDF not found or could not be retrieved.');
            }
        } catch (error) {
            console.error('Error fetching PDF:', error);
        }
    };

    return (
        <HelmetProvider>
            <div className="add-session-container">
                <Helmet>
                   <title>
                        {isAddAfter
                            ? t("addTopicForm.addBelow")
                            : isAddBefore
                            ? t("addTopicForm.addAbove")
                            : idt
                            ? t("addTopicForm.editTitle")
                            : t("addTopicForm.addTitle")}
                    </title>
                </Helmet>
                <Header userInfo={userInfo} />

                <div className="add-session-body-container container">
                    <div className="container mt-4">
                        <div className="add-session-header-div">
                           <h1>
                                {isAddAfter
                                    ? t("addTopicForm.addBelow")
                                    : isAddBefore
                                    ? t("addTopicForm.addAbove")
                                    : idt
                                    ? t("addTopicForm.editTitle")
                                    : t("addTopicForm.addTitle")}
                            </h1>
                        </div>

                        <div className="row justify-content-center">
                            <div className="col-md-6">
                                <form onSubmit={handleSubmit}>
                                    <div className="form-group">
                                        <label htmlFor="title" className="label-add">{t("addTopicForm.topicTitle")}</label>
                                        <input type="text" className="form-control form-control-lg mb-2" id="title" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("addTopicForm.placeholder")}/>
                                    </div>

                                    <label htmlFor="file" className="label-add">{t("addTopicForm.uploadPdf")}</label>
                                    <div className="form-group d-flex justify-content-center">
                                        <div className={`file-drop-area ${fileError || fileTypeError ? 'is-active' : ''}`}>
                                            <p className="file-drop-message">
                                            {t('addTopicForm.dropHere')} <span>{t('addTopicForm.orClick')}</span>
                                            </p>
                                            <input type="file" id="file" name="file" accept="application/pdf" onChange={handleFileInputChange}/>
                                        </div>
                                    </div>

                                    {fileError && <div className="error-message-pdf text-danger">{t("addTopicForm.maxSizeError")}</div>}
                                    {fileTypeError && <div className="error-message-pdf text-danger">{t("addTopicForm.typeError")}</div>}

                                    {currentPdfFileName && (
                                        <div>
                                            <span>{t("addTopicForm.currentPdf")}: </span>
                                            <span onClick={() => handlePdfFetch(pdfId)} style={{ cursor: 'pointer', color: 'blue', textDecoration: 'underline' }}>
                                                {currentPdfFileName}
                                            </span>
                                        </div>
                                    )}

                                    <div className="form-group">
                                        <label htmlFor="topicStatus" className="label-add">{t("addTopicForm.topicStatus")}</label>
                                        <select id="topicStatus" className="form-control form-control-lg mb-2" value={topicStatus} onChange={(e) => setTopicStatus(e.target.value)} required>
                                            <option value="" disabled>{t("addTopicForm.selectStatus")}</option>
                                            {topicStatusOptions.map(status => <option key={status.value} value={status.value}>{status.label}</option>)}
                                        </select>
                                    </div>

                                    <div className="mt-3 d-flex flex-start">
                                         <button
                                            type="submit"
                                            className={`btn ${idt && !isAddAfter && !isAddBefore ? "btn-warning" : "btn-primary"} btn-lg me-2`}
                                        >
                                            {idt && !isAddAfter && !isAddBefore ? t("addTopicForm.editButton") : t("addTopicForm.addButton")}
                                        </button>
                                        <button type="button" className="btn btn-danger btn-lg" onClick={() => navigate(idt ? `/municipalities/${municipalityId}/sessions/${id}/topics#topic-${idt}` : `/municipalities/${municipalityId}/sessions/${id}/topics`)}>
                                            {t("addTopicForm.back")}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>

                {exportLoading && (
                    <div className="modal-overlay">
                        <div className="export-loading-spinner">
                            <img src={`${process.env.PUBLIC_URL}/images/loading.svg`} alt="Export Loading..." />
                        </div>
                    </div>
                )}
            </div>
        </HelmetProvider>
    );
};

export default AddTopicForm;
