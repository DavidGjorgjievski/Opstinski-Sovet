// sessionModalHelper.js
let showSessionExpiredFunc = null;

export const setShowSessionExpired = (fn) => {
  showSessionExpiredFunc = fn;
};

export const triggerSessionExpired = () => {
  if (showSessionExpiredFunc) showSessionExpiredFunc();
};
