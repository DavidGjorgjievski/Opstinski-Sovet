import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import Header from '../components/Header';
import {
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handlePaste,
    MAX_FILE_SIZE_BYTES,
} from '../util/fileUpload';
import '../styles/AddTopicForm.css';
import PDFConfirmModal from "../components/PDFConfirmModal";
import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare, faPlus, faChevronLeft, faTrash } from '@fortawesome/free-solid-svg-icons';
import api from '../api/axios';

const AddAmendmentForm = () => {
    const { idt, amendmentId, municipalityId } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [title, setTitle] = useState('');
    const [files, setFiles] = useState([]);
    const [pdfId, setPdfId] = useState(null);
    const [amount, setAmount] = useState('');
    const [fileError, setFileError] = useState(false);
    const [fileTypeError, setFileTypeError] = useState(false);
    const [currentPdfFileName, setCurrentPdfFileName] = useState('');
    const [amendmentStatus, setAmendmentStatus] = useState('CREATED');
    const [exportLoading, setExportLoading] = useState(false);
    const [totalSize, setTotalSize] = useState(0);
    const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
    const [open, setOpen] = useState(false);
    const [dropUp, setDropUp] = useState(false);

    const dropdownRef = useRef(null);
    const fileInputRef = useRef(null);
    const textareaRef = useRef(null);

    const minRows = 3;
    const maxRows = 10;
    const lineHeight = 24;

    const isEditing = !!amendmentId;

    const topicStatusOptions = [
        { value: 'CREATED', label: t("addTopicForm.statusOptions.created") },
        { value: 'ACTIVE', label: t("addTopicForm.statusOptions.active") },
        { value: 'FINISHED', label: t("addTopicForm.statusOptions.finished") },
    ];

    // Use dropdown only when editing
    const statusOptions = isEditing ? topicStatusOptions : [];

    // Auto-resize textarea
    const resizeTextarea = useCallback(() => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        textarea.rows = minRows;
        const currentRows = Math.floor(textarea.scrollHeight / lineHeight);
        textarea.rows = Math.min(Math.max(currentRows, minRows), maxRows);
    }, []);

    // Fetch amendment if editing
    useEffect(() => {
        if (!isEditing) {
            setAmendmentStatus("CREATED");
            return;
        }

        const fetchAmendment = async () => {
            try {
                const { data } = await api.get(`/api/topics/${idt}/amendments/${amendmentId}`);
                setTitle(data.title || '');
                setAmount(data.amount || '');
                setAmendmentStatus(data.status || 'CREATED');
                setCurrentPdfFileName(data.pdfFileName || '');
                setPdfId(data.pdfFileId || null);
            } catch (err) {
                console.error("Error fetching amendment:", err);
            }
        };

        fetchAmendment();
    }, [amendmentId, idt, isEditing]);

    // Submit handler
   const handleSubmit = async (e) => {
    e.preventDefault();
    setExportLoading(true);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("status", amendmentStatus); // Always set CREATED for add
    if (amount) formData.append("amount", amount);
    if (!isEditing) formData.append("municipalityId", municipalityId);

    files.forEach(f => formData.append("files", f));

    try {
        let endpoint;
        let method = 'post';

        if (isEditing) {
            endpoint = `/api/topics/${idt}/amendments/${amendmentId}`;
            method = 'put';
        } else {
            endpoint = `/api/topics/${idt}/amendments`;
        }

        const response = method === 'post'
            ? await api.post(endpoint, formData)
            : await api.put(endpoint, formData);

        // Get the amendment ID
        const newAmendmentId = isEditing ? amendmentId : response.data.amendmentId;

        // Navigate to amendments page and scroll to the amendment
        navigate(`/municipalities/${municipalityId}/sessions/${idt}/topics/amendments/${idt}#amendment-${newAmendmentId}`);
    } catch (err) {
        console.error("Error submitting amendment:", err);
    } finally {
        setExportLoading(false);
    }
};

    // File handling
    const validateAndSetFiles = (selectedFiles) => {
        setFileError(false);
        setFileTypeError(false);

        const validFiles = selectedFiles.filter(file => {
            if (file.type !== 'application/pdf') {
                setFileTypeError(true);
                return false;
            }
            if (file.size > MAX_FILE_SIZE_BYTES) {
                setFileError(true);
                return false;
            }
            const duplicate = files.some(f => f.name === file.name && f.size === file.size);
            return !duplicate;
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
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handlePdfFetch = async (pdfId) => {
        try {
            const response = await api.get(`/api/topics/amendments/pdf/${pdfId}`, {
                responseType: 'blob',
                headers: { Accept: 'application/pdf' },
            });
            const url = URL.createObjectURL(response.data);
            window.open(url, "_blank");
            setTimeout(() => URL.revokeObjectURL(url), 10000);
        } catch (err) {
            console.error("Error fetching PDF:", err);
        }
    };

    const handleRemovePdf = async () => {
        try {
            await api.delete(`/api/topics/${idt}/amendments/${amendmentId}/pdf`);
            setCurrentPdfFileName('');
            setPdfId(null);
            setFiles([]);
        } catch (err) {
            console.error("Error removing PDF:", err);
        }
    };

    useEffect(() => {
        const total = files.reduce((acc, f) => acc + f.size, 0);
        setTotalSize(total);
    }, [files]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleDropdown = () => {
        if (dropdownRef.current) {
            const rect = dropdownRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const dropdownHeight = 200;
            setDropUp(spaceBelow < dropdownHeight);
        }
        setOpen(prev => !prev);
    };

    useEffect(() => {
        if (textareaRef.current && title) resizeTextarea();
    }, [title, resizeTextarea]);

    return (
        <HelmetProvider>
            <div className="add-topic-container">
                <Helmet>
                    <title>
                        {isEditing ? t("addAmendmentForm.editTitle") : t("addAmendmentForm.addTitle")}
                    </title>
                </Helmet>

                <Header isSticky={true} />

                <div className="add-topic-body-container">
                    <div className="add-topic-header-div">
                        <h1>{isEditing ? t("addAmendmentForm.editTitle") : t("addAmendmentForm.addTitle")}</h1>
                    </div>

                    <div className="row justify-content-center">
                        <div>
                            <form onSubmit={handleSubmit}>
                                {/* Title */}
                                <div className="form-group">
                                    <label className="label-add">{t("addAmendmentForm.title")}</label>
                                    <textarea
                                        ref={textareaRef}
                                        className="mb-1 topic-textarea-title"
                                        value={title}
                                        onChange={(e) => {
                                            const value = e.target.value.slice(0, 500);
                                            setTitle(value);
                                            resizeTextarea();
                                        }}
                                        placeholder={t("addAmendmentForm.placeholder")}
                                        rows={minRows}
                                        maxLength={500}
                                        required
                                    />
                                    <div className="character-counter">{title.length}/500</div>
                                </div>

                                {/* PDF Upload */}
                                <label className="label-add">{t("addAmendmentForm.uploadPdf")}</label>
                                <p className="optional-text">{t("addAmendmentForm.optional")}</p>
                                <div className="form-group d-flex justify-content-center">
                                    <div className={`file-drop-area ${fileError || fileTypeError ? 'is-active' : ''}`}>
                                        <p className="file-drop-message">
                                            {t('addTopicForm.dropHere')} <span>{t('addTopicForm.orClick')}</span>
                                        </p>
                                        <input
                                            type="file"
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
                                                    <span>{f.name} ({(f.size/(1024*1024)).toFixed(2)} MB)</span>
                                                    <button type="button" onClick={() => setFiles(prev => prev.filter((_, i) => i !== idx))}>
                                                        <FontAwesomeIcon icon={faTrash} />
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                        <div className="total-size mt-1 text-muted">
                                            {(totalSize/(1024*1024)).toFixed(2)} MB / {(MAX_FILE_SIZE_BYTES/(1024*1024)).toFixed(0)} MB
                                        </div>
                                    </div>
                                )}

                                {currentPdfFileName && (
                                    <div className="current-pdf-div mt-2 d-flex align-items-center">
                                        <span className="current-pdf-label me-2">{t("addAmendmentForm.currentPdf")}:</span>
                                        <span className="pdf-link me-2" onClick={() => handlePdfFetch(pdfId)} style={{ cursor: 'pointer' }}>
                                            {currentPdfFileName}
                                        </span>
                                        <button type="button" onClick={() => setIsPdfModalOpen(true)}>
                                            {t("addAmendmentForm.removePdf")} <FontAwesomeIcon icon={faTrash} />
                                        </button>
                                    </div>
                                )}

                                {/* Status dropdown only when editing */}
                                {isEditing && (
                                    <div className="topic-status-select-wrapper mt-3" ref={dropdownRef}>
                                        <label className="label-add">{t("addAmendmentForm.selectStatus")}</label>
                                        <div className="custom-select-box" onClick={toggleDropdown} tabIndex={0}>
                                            {statusOptions.find(o => o.value === amendmentStatus)?.label || "Select Status"}
                                        </div>
                                        {open && (
                                            <div className={`custom-options ${dropUp ? 'drop-up' : ''}`}>
                                                {statusOptions.map(option => (
                                                    <div key={option.value}
                                                        className={`custom-option ${amendmentStatus === option.value ? "selected" : ""}`}
                                                        onClick={() => { setAmendmentStatus(option.value); setOpen(false); }}>
                                                        {option.label}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Amount */}
                                <div className="form-group mt-3">
                                    <label className="label-add">{t("addAmendmentForm.amount")}</label>
                                    <p className="optional-text">{t("addAmendmentForm.optional")}</p>
                                    <input
                                        type="number"
                                        className="topic-amount-input"
                                        value={amount}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val === '' || Number(val) <= 0) setAmount('');
                                            else setAmount(val);
                                        }}
                                        onKeyDown={(e) => ['e','E','+','-'].includes(e.key) && e.preventDefault()}
                                        placeholder={t("addAmendmentForm.amountPlaceholder")}
                                        min={1}
                                        step={1}
                                    />
                                </div>

                                {/* Buttons */}
                                <div className="mt-3 d-flex flex-start">
                                    <button type="submit" className="add-form-submit-button me-2">
                                        {isEditing ? (
                                            <>
                                                <FontAwesomeIcon icon={faPenToSquare} className="me-2" />
                                                {t("addAmendmentForm.editButton")}
                                            </>
                                        ) : (
                                            <>
                                                <FontAwesomeIcon icon={faPlus} className="me-2" />
                                                {t("addAmendmentForm.addButton")}
                                            </>
                                        )}
                                    </button>

                                    <button
                                        type="button"
                                        className="add-form-back-button"
                                        onClick={() => navigate(`/municipalities/${municipalityId}/sessions/${idt}/topics/amendments/${idt}`)}
                                    >
                                        <FontAwesomeIcon icon={faChevronLeft} className="me-2" />
                                        {t("addAmendmentForm.back")}
                                    </button>

                                </div>
                            </form>
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

                <PDFConfirmModal
                    isOpen={isPdfModalOpen}
                    pdfName={currentPdfFileName}
                    onClose={() => setIsPdfModalOpen(false)}
                    onConfirm={async () => {
                        await handleRemovePdf();
                        setIsPdfModalOpen(false);
                    }}
                />
            </div>
        </HelmetProvider>
    );
};

export default AddAmendmentForm;
