const routes = [
    // Amendments (most specific first)
    { pattern: /^\/municipalities\/\d+\/sessions\/[^/]+\/topics\/amendments/, key: 'amendments.title' },
    // Topic sub-pages
    { pattern: /^\/municipalities\/\d+\/sessions\/[^/]+\/topics-presentation/, key: 'topicsPage.pageTitle' },
    { pattern: /^\/municipalities\/\d+\/sessions\/[^/]+\/topics/, key: 'topicsPage.pageTitle' },
    // Sessions
    { pattern: /^\/municipalities\/\d+\/sessions/, key: 'session.title' },
    // Municipality mandate
    { pattern: /^\/municipalities\/\d+\/mandates/, key: 'MunicipalityMandate.mandateTitle' },
    // Municipalities
    { pattern: /^\/municipalities/, key: 'Municipality.municipalitiesTitle' },
    // Admin panel
    { pattern: /^\/admin-panel/, key: 'adminPanel.adminPanelTitle' },
    // Mandate
    { pattern: /^\/mandate/, key: 'mandate.title' },
    // Profile sub-pages
    { pattern: /^\/profile\/change-password-form/, key: 'changePassword.title' },
    { pattern: /^\/profile\/change-image-form/, key: 'changeImage.title' },
    { pattern: /^\/profile\/change-email-form/, key: 'changeEmail.title' },
    { pattern: /^\/profile/, key: 'profile.title' },
    { pattern: /^\/profile-view/, key: 'profile.title' },
    // Other
    { pattern: /^\/monitoring/, key: 'monitoring.title' },
    { pattern: /^\/$/, key: 'home.title' },
];

export function pageKeyFromPath(pathname) {
    for (const route of routes) {
        if (route.pattern.test(pathname)) return route.key;
    }
    return pathname;
}

function getMunicipalityName(municipalityId) {
    try {
        const municipalities = JSON.parse(localStorage.getItem('municipalities') || '[]');
        const m = municipalities.find(m => String(m.id) === String(municipalityId));
        return m?.name || null;
    } catch { return null; }
}

function getSessionName(municipalityId, sessionId) {
    try {
        const sessions = JSON.parse(localStorage.getItem(`sessions_${municipalityId}`) || '[]');
        const s = sessions.find(s => String(s.id) === String(sessionId));
        return s?.name || null;
    } catch { return null; }
}

function enrichedLabel(pageTitle, municipalityId, sessionId) {
    const sessionName = sessionId ? getSessionName(municipalityId, sessionId) : null;
    const municipalityName = getMunicipalityName(municipalityId);
    const contextParts = [];
    if (sessionName) contextParts.push(sessionName);
    if (municipalityName) contextParts.push(`(${municipalityName})`);
    if (contextParts.length === 0) return pageTitle;
    return `${pageTitle}\n${contextParts.join(' · ')}`;
}

export function buildCurrentPageLabel(pathname, t) {
    // Amendments: /municipalities/:mid/sessions/:sid/topics/amendments
    let m = pathname.match(/^\/municipalities\/(\d+)\/sessions\/([^/]+)\/topics\/amendments/);
    if (m) return enrichedLabel(t('amendments.title'), m[1], m[2]);

    // Topics-presentation: /municipalities/:mid/sessions/:sid/topics-presentation
    m = pathname.match(/^\/municipalities\/(\d+)\/sessions\/([^/]+)\/topics-presentation/);
    if (m) return enrichedLabel(t('topicsPage.pageTitle'), m[1], m[2]);

    // Topics: /municipalities/:mid/sessions/:sid/topics
    m = pathname.match(/^\/municipalities\/(\d+)\/sessions\/([^/]+)\/topics/);
    if (m) return enrichedLabel(t('topicsPage.pageTitle'), m[1], m[2]);

    // Sessions list: /municipalities/:mid/sessions
    m = pathname.match(/^\/municipalities\/(\d+)\/sessions/);
    if (m) return enrichedLabel(t('session.title'), m[1], null);

    // Fall back to translated page title
    const key = pageKeyFromPath(pathname);
    return t(key, { defaultValue: key });
}
