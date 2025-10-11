/**
 * Notification System Module
 * Handles displaying temporary notifications to the user
 */

// Constants for notification system
const NOTIFICATION_DURATION_MS = 5000;
const ANIMATION_DURATION_MS = 300;
const NOTIFICATION_COLORS = {
  success: '#4CAF50',
  error: '#f44336',
  warning: '#ff9800',
  info: '#2196F3'
};

/**
 * Ensure animation styles are added to the document
 */
function ensureAnimationStyles() {
  if (!document.getElementById('notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
    document.head.appendChild(style);
  }
}

/**
 * Create a notification element with the specified styling
 * @param {string} message - The notification message
 * @param {string} backgroundColor - The background color for the notification
 * @returns {HTMLElement} The notification element
 */
function createNotificationElement(message, backgroundColor) {
  const notification = document.createElement('div');
  notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${backgroundColor};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        z-index: 1000;
        font-size: 0.9rem;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        animation: slideIn 0.3s ease-out;
        max-width: 300px;
        word-wrap: break-word;
    `;
  notification.textContent = message;
  return notification;
}

/**
 * Remove a notification with animation
 * @param {HTMLElement} notification - The notification element to remove
 */
function removeNotification(notification) {
  notification.style.animation = 'slideIn 0.3s ease-out reverse';
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, ANIMATION_DURATION_MS);
}

/**
 * Show a notification that the session was restored
 * @param {number} dataPointCount - Number of data points recovered
 */
export function showSessionRestoredNotification(dataPointCount) {
  ensureAnimationStyles();

  const message = `Session restored! ${dataPointCount} data points recovered.`;
  const notification = createNotificationElement(message, NOTIFICATION_COLORS.success);

  document.body.appendChild(notification);

  // Remove notification after duration
  setTimeout(() => {
    removeNotification(notification);
  }, NOTIFICATION_DURATION_MS);
}

/**
 * Show a generic notification with custom message and type
 * @param {string} message - The message to display
 * @param {string} type - The type of notification ('success', 'error', 'info', 'warning')
 * @param {number} duration - Duration in milliseconds to show the notification (default: 5000ms)
 */
export function showNotification(message, type = 'info', duration = NOTIFICATION_DURATION_MS) {
  ensureAnimationStyles();

  const backgroundColor = NOTIFICATION_COLORS[type] || NOTIFICATION_COLORS.info;
  const notification = createNotificationElement(message, backgroundColor);

  document.body.appendChild(notification);

  // Remove notification after specified duration
  setTimeout(() => {
    removeNotification(notification);
  }, duration);
}