import React, { useRef, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import Header from '../components/Header';
import { initializeMobileMenu } from '../components/mobileMenu';
import {
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handlePaste,
    MAX_FILE_SIZE_BYTES,
} from '../util/fileUpload';
import '../styles/AddTopicForm.css';
import useNewTopicWebSocket from "../hooks/useNewTopicWebSocket";
import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'; 
import { faPenToSquare, faPlus, faChevronLeft, faTrash } from '@fortawesome/free-solid-svg-icons';
import api from '../api/axios';

const AddTopicForm = () => {
    const { id, idt, municipalityId } = useParams();
    const [title, setTitle] = useState('');
    const [files, setFiles] = useState([]);   
    const [pdfId, setPdfId] = useState(null);
    const [fileError, setFileError] = useState(false);
    const [fileTypeError, setFileTypeError] = useState(false);
    const [currentPdfFileName, setCurrentPdfFileName] = useState('');
    const navigate = useNavigate();
    const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};
    const isAddAfter = !!idt && window.location.pathname.includes('add-after');
    const isAddBefore = !!idt && window.location.pathname.includes('add-before');
    const [exportLoading, setExportLoading] = useState(false);
    const [totalSize, setTotalSize] = useState(0);
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef(null);
    const [dropUp, setDropUp] = useState(false);

    const fileInputRef = useRef(null);
    const { sendNewTopic } = useNewTopicWebSocket(id);

    const [topicStatus, setTopicStatus] = useState('');

    const isEditing = !!idt && !isAddAfter && !isAddBefore;

    const topicStatusOptions = [
        { value: 'CREATED', label: t("addTopicForm.statusOptions.created") },
        { value: 'ACTIVE', label: t("addTopicForm.statusOptions.active") },
        { value: 'FINISHED', label: t("addTopicForm.statusOptions.finished") },
        { value: 'INFORMATION', label: t("addTopicForm.statusOptions.information") },
        { value: 'WITHDRAWN', label: t("addTopicForm.statusOptions.withdrawn") },
    ];

    const createStatusOptions = [
    { value: 'CREATED', label: t("addTopicForm.statusOptions.created") },
    { value: 'INFORMATION', label: t("addTopicForm.statusOptions.information") },
    { value: 'WITHDRAWN', label: t("addTopicForm.statusOptions.withdrawn") },
    ];

    const statusOptions = isEditing ? topicStatusOptions : createStatusOptions;

    // fetch topic if editing
   useEffect(() => {
    if (isAddAfter || isAddBefore) {
        setTopicStatus("CREATED");
        return;
    }

    if (!idt) {
        setTopicStatus("CREATED");
        return;
    }

    const fetchTopic = async () => {
        try {
        const { data: topicData } = await api.get(
            `/api/sessions/${id}/topics/${idt}`
        );

        setTitle(topicData.title);
        setCurrentPdfFileName(topicData.pdfFileName);
        setPdfId(topicData.pdfFileId);
        setTopicStatus(topicData.topicStatus || "CREATED");
        } catch (error) {
        console.error("Error fetching the topic:", error);
        }
    };

    fetchTopic();
    }, [idt, id, isAddAfter, isAddBefore]);

    // handle submit
   const handleSubmit = async (e) => {
    e.preventDefault();
    setExportLoading(true);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("topicStatus", topicStatus);

    files.forEach(file => formData.append("files", file));

    try {
        let endpoint;

        if (isAddAfter) {
        endpoint = `/api/sessions/${id}/topics/add-after/${idt}`;
        } else if (isAddBefore) {
        endpoint = `/api/sessions/${id}/topics/add-before/${idt}`;
        } else if (idt) {
        endpoint = `/api/topics/edit/${idt}`;
        } else {
        endpoint = `/api/sessions/${id}/topic/add`;
        }

        // Municipality is needed only in these cases
        if (!idt || isAddAfter || isAddBefore) {
        formData.append("municipalityId", municipalityId);
        }

        const { data } = await api.post(endpoint, formData);

        const topicId = data.topicId;

        sendNewTopic("NEW_TOPIC");
        sessionStorage.removeItem("scrollPosition");

        navigate(
        `/municipalities/${municipalityId}/sessions/${id}/topics#topic-${topicId}`
        );
    } catch (error) {
        console.error("Error submitting the form:", error);
    } finally {
        setExportLoading(false);
    }
    };

    // init mobile menu
    useEffect(() => initializeMobileMenu(), []);

    // drag + paste listeners
    useEffect(() => {
        const fileDropArea = document.querySelector('.file-drop-area');
        if (!fileDropArea) return;

        const dragOverHandler = (e) => handleDragOver(e, fileDropArea);
        const dragLeaveHandler = () => handleDragLeave(fileDropArea);
        const dropHandler = (e) => handleDrop(e, setFiles, null, setFileError, setFileTypeError, files);
        const pasteHandler = (e) => handlePaste(e, setFiles, null, setFileError, setFileTypeError, files);


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
    }, [files]);

  const validateAndSetFiles = (selectedFiles) => {
    setFileError(false);
    setFileTypeError(false);

    const validFiles = selectedFiles.filter(file => {
        // Check type
        if (file.type !== 'application/pdf') {
            setFileTypeError(true);
            return false;
        }
        // Check individual file size
        if (file.size > MAX_FILE_SIZE_BYTES) {
            setFileError(true);
            return false;
        }
        // Prevent duplicates: same name + size
        const isDuplicate = files.some(f => f.name === file.name && f.size === file.size);
        if (isDuplicate) return false;

        return true;
    });

    const newFiles = [...files, ...validFiles];
    const totalBytes = newFiles.reduce((acc, f) => acc + f.size, 0);

    if (totalBytes > MAX_FILE_SIZE_BYTES) {
        setFileError(true);
        return;
    }

    setFiles(newFiles);
};

    const handleFileInputChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        validateAndSetFiles(selectedFiles);
        if (fileInputRef.current) {
        fileInputRef.current.value = '';
        }
    };

    const handlePdfFetch = async (pdfId) => {
        try {
            const response = await api.get(`/api/topics/pdf/${pdfId}`, {
            responseType: "blob", 
            headers: {
                Accept: "application/pdf",
            },
            });

            const url = URL.createObjectURL(response.data);
            window.open(url, "_blank");

            // Free memory after some time
            setTimeout(() => URL.revokeObjectURL(url), 10000);
        } catch (error) {
            console.error("Error fetching PDF:", error);
        }
    };


    useEffect(() => {
        const total = files.reduce((acc, f) => acc + f.size, 0);
        setTotalSize(total);
    }, [files]);

    useEffect(() => {
    // Scroll to top when the component mounts
    window.scrollTo({ top: 0, behavior: 'smooth' });
}, []);

useEffect(() => {
    const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            setOpen(false); // close the dropdown
        }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
}, []);

const toggleDropdown = () => {
  if (dropdownRef.current) {
    const rect = dropdownRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const dropdownHeight = 200; // max-height of your dropdown in px

    setDropUp(spaceBelow < dropdownHeight);
  }
  setOpen(prev => !prev);
};

    return (
        <HelmetProvider>
            <div className="add-topic-container">
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

                <Header userInfo={userInfo} isSticky={true} />

                <div className="add-topic-body-container">
                    <div>
                        <div className="add-topic-header-div">
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
                            <div>
                                <form onSubmit={handleSubmit}>
                                    <div className="form-group">
                                        <label htmlFor="title" className="label-add">{t("addTopicForm.topicTitle")}</label>
                                           <textarea
                                            id="title"
                                            name="title"
                                            className="mb-2 topic-textarea-title"
                                            value={title}
                                                onChange={(e) => setTitle(e.target.value)}
                                                required
                                                placeholder={t("addTopicForm.placeholder")}
                                                rows={title.split("\n").length > 1 ? 2 : 1}
                                            />
                                    </div>
                                    <label htmlFor="file" className="label-add">{t("addTopicForm.uploadPdf")}</label>
                                    <div className="form-group d-flex justify-content-center">
                                        <div className={`file-drop-area ${fileError || fileTypeError ? 'is-active' : ''}`}>
                                            <p className="file-drop-message">
                                                {t('addTopicForm.dropHere')} <span>{t('addTopicForm.orClick')}</span>
                                            </p>
                                            <input
                                                type="file"
                                                id="file"
                                                name="file"
                                                accept="application/pdf"
                                                multiple
                                                ref={fileInputRef}
                                                onChange={handleFileInputChange}
                                            />
                                        </div>
                                    </div>

                                    {fileError && <div className="error-message-pdf text-danger">{t("addTopicForm.maxSizeError")}</div>}
                                    {fileTypeError && <div className="error-message-pdf text-danger">{t("addTopicForm.typeError")}</div>}

                                   {files.length > 0 && (
                                    <div className="uploaded-files mt-3">
                                        <h6>{t("addTopicForm.selectedFiles")}</h6>
                                        <ul className="file-list">
                                            {files.map((f, idx) => (
                                                <li key={idx} className="file-item d-flex align-items-center justify-content-between">
                                                    <span className="file-name">
                                                        {f.name} <span className="file-size">({(f.size / (1024 * 1024)).toFixed(2)} MB)</span>
                                                    </span>
                                                    <button
                                                        type="button"
                                                        className="remove-file-btn ms-2"
                                                        onClick={() => setFiles(prev => prev.filter((_, i) => i !== idx))}
                                                        >
                                                        <FontAwesomeIcon icon={faTrash} />
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                        <div className="total-size mt-1 text-muted">
                                            {(totalSize / (1024*1024)).toFixed(2)} MB / {(MAX_FILE_SIZE_BYTES / (1024*1024)).toFixed(0)} MB
                                        </div>
                                    </div>
                                )}


                                    {currentPdfFileName && (
                                        <div className="current-pdf-div mt-2">
                                            <span className="current-pdf-label">
                                            {t("addTopicForm.currentPdf")}:
                                            </span>
                                            <span
                                            className="pdf-link"
                                            onClick={() => handlePdfFetch(pdfId)}
                                            >
                                            {currentPdfFileName}
                                            </span>
                                        </div>
                                    )}

                                   <div className="topic-status-select-wrapper mt-3" ref={dropdownRef}>
                                        <label htmlFor="topicStatus" className="label-add">{t("addTopicForm.selectStatus")}</label>

                                        <div
                                            className="custom-select-box"
                                            onClick={toggleDropdown}
                                            tabIndex={0}
                                        >
                                            {statusOptions.find((o) => o.value === topicStatus)?.label || "Select Status"}
                                        </div>

                                        {open && (
                                            <div className={`custom-options ${dropUp ? 'drop-up' : ''}`}>
                                                {statusOptions.map((option) => (
                                                    <div
                                                        key={option.value}
                                                        className={`custom-option ${topicStatus === option.value ? "selected" : ""}`}
                                                        onClick={() => {
                                                            setTopicStatus(option.value);
                                                            setOpen(false);
                                                        }}
                                                    >
                                                        {option.label}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-3 d-flex flex-start">
                                        <button
                                            type="submit"
                                            className="topic-form-submit-button me-2"
                                        >
                                            {idt && !isAddAfter && !isAddBefore ? (
                                                <>
                                                    <FontAwesomeIcon icon={faPenToSquare} className="me-2" />
                                                    {t("addTopicForm.editButton")}
                                                </>
                                            ) : (
                                                <>
                                                    <FontAwesomeIcon icon={faPlus} className="me-2" />
                                                    {t("addTopicForm.addButton")}
                                                </>
                                            )}
                                        </button>

                                        <button
                                            type="button"
                                            className="topic-form-back-button"
                                            onClick={() => navigate(
                                                idt
                                                    ? `/municipalities/${municipalityId}/sessions/${id}/topics#topic-${idt}`
                                                    : `/municipalities/${municipalityId}/sessions/${id}/topics`
                                            )}
                                        >
                                            <FontAwesomeIcon icon={faChevronLeft} className="me-2" />
                                            {t("addTopicForm.back")}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>

                    <p>&nbsp;</p>
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