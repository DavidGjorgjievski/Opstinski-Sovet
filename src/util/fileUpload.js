export const MAX_FILE_SIZE_MB = 20;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const handleDragOver = (event, dropArea) => {
    event.preventDefault();
    dropArea.classList.add('is-active');
};

export const handleDragLeave = (dropArea) => {
    dropArea.classList.remove('is-active');
};

export const handleDrop = (event, fileInput, updateFileName, setFileError, setFileTypeError) => {
    event.preventDefault();
    const files = event.dataTransfer.files;

    // Clear previous error messages
    setFileError(false);
    setFileTypeError(false);

    if (files.length) {
        const file = files[0];
        fileInput.files = files;
        if (file.type !== 'application/pdf') {
            setFileTypeError(true);
            updateFileName(''); // Clear file name if error
            return;
        }
        checkFileSize(fileInput, updateFileName, setFileError, setFileTypeError);
    }
};

export const handleFileChange = (event, updateFileName, setFileError, setFileTypeError) => {
    // Clear previous error messages
    setFileError(false);
    setFileTypeError(false);

    const file = event.target.files[0];
    if (file.type !== 'application/pdf') {
        setFileTypeError(true);
        updateFileName(''); // Clear file name if error
        return;
    }
    checkFileSize(event.target, updateFileName, setFileError, setFileTypeError);
};

const checkFileSize = (fileInput, updateFileName, setFileError, setFileTypeError) => {
    const file = fileInput.files[0];

    if (file.size > MAX_FILE_SIZE_BYTES) {
        setFileError(true);
        updateFileName(''); // Clear file name if error
    } else {
        updateFileName(file.name);
        setFileError(false); // Reset error state if file is valid
        setFileTypeError(false); // Reset file type error state
    }
};

export const handlePaste = (event, fileInput, updateFileName, setFileError, setFileTypeError) => {
    // Clear previous error messages
    setFileError(false);
    setFileTypeError(false);

    const items = (event.clipboardData || window.clipboardData).items;
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === 'file' && item.type === 'application/pdf') {
            const file = item.getAsFile();
            fileInput.files = [file];
            checkFileSize(fileInput, updateFileName, setFileError, setFileTypeError);
        }
    }
};
