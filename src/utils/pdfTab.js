export function openPdfTab() {
    const newTab = window.open('', '_blank');
    if (newTab) {
        newTab.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Loading PDF…</title><style>body{margin:0;display:flex;align-items:center;justify-content:center;height:100vh;background:#f5f5f5}.spinner{width:20px;height:20px;border:3px solid #ddd;border-top-color:#555;border-radius:50%;animation:spin .8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}</style></head><body><div class="spinner"></div></body></html>`);
        newTab.document.close();
    }
    return newTab;
}

export function sanitizeFilenameForUrl(fileName) {
    // eslint-disable-next-line no-control-regex
    let name = (fileName || 'document.pdf').replace(/[:"'/\\?#%*|<>\x00-\x1F]/g, '');
    if (name.length > 100) {
        name = name.slice(0, 96) + '.pdf';
    }
    return name || 'document.pdf';
}
