/**
 * Navigation helper for Dashboard to Camera View
 * @param {Function} setActiveTab - Your state setter for active tab
 */
export const navigateToCamera = (setActiveTab) => {
  console.log('✅ Navigating to Camera View from Dashboard...');
  setActiveTab('camera');
};

/**
 * Navigation helper for any tab
 * @param {Function} setActiveTab - Your state setter for active tab
 * @param {string} tabName - Name of the tab to navigate to
 */
export const navigateTo = (setActiveTab, tabName) => {
  console.log(`✅ Navigating to ${tabName}...`);
  setActiveTab(tabName);
};