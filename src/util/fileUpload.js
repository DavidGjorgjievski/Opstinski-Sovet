export const MAX_FILE_SIZE_MB = 15;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const sanitizePdfFile = (file) => {
    // eslint-disable-next-line no-control-regex
    let name = file.name.replace(/[;"'/\\:?#%*|<>\x00-\x1F]/g, '');
    if (name.length > 999) {
        name = name.slice(0, 995) + '.pdf';
    }
    return name === file.name ? file : new File([file], name, { type: file.type });
};

export const handleDragOver = (event, dropArea) => {
    event.preventDefault();
    dropArea.classList.add('is-active');
};

export const handleDragLeave = (dropArea) => {
    dropArea.classList.remove('is-active');
};

/**
 * Handle file drop
 */
export const handleDrop = (event, setFiles, updateFileName, setFileError, setFileTypeError, existingFiles = []) => {
    event.preventDefault();

    setFileError(false);
    setFileTypeError(false);

    const droppedFiles = Array.from(event.dataTransfer.files);

    const validFiles = droppedFiles.filter(file => {
        if (file.type !== "application/pdf") {
            setFileTypeError(true);
            return false;
        }
        return true;
    }).map(sanitizePdfFile);

    const totalSize = [...existingFiles, ...validFiles].reduce((acc, f) => acc + f.size, 0);

    if (totalSize > MAX_FILE_SIZE_BYTES) {
        setFileError(true);
        return;
    }

    if (validFiles.length > 0) {
        setFiles(prev => [...prev, ...validFiles]);
        if (updateFileName) {
            updateFileName(validFiles.map(f => f.name).join(", "));
        }
    }
};


/**
 * Handle pasted file(s)
 */
export const handlePaste = (event, setFiles, updateFileName, setFileError, setFileTypeError, existingFiles = []) => {
    setFileError(false);
    setFileTypeError(false);

    const items = (event.clipboardData || window.clipboardData).items;
    const pastedFiles = [];

    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === "file" && item.type === "application/pdf") {
            const file = item.getAsFile();
            pastedFiles.push(sanitizePdfFile(file));
        }
    }

    const totalSize = [...existingFiles, ...pastedFiles].reduce((acc, f) => acc + f.size, 0);

    if (totalSize > MAX_FILE_SIZE_BYTES) {
        setFileError(true);
        return;
    }

    if (pastedFiles.length > 0) {
        setFiles(prev => [...prev, ...pastedFiles]);
        if (updateFileName) {
            updateFileName(pastedFiles.map(f => f.name).join(", "));
        }
    }
};

