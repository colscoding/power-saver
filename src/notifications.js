/**
 * Notification System Module
 * Handles displaying temporary notifications to the user
 */

/**
 * Show a notification that the session was restored
 * @param {number} dataPointCount - Number of data points recovered
 */
export function showSessionRestoredNotification(dataPointCount) {
    const notification = document.createElement('div');
    notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #4CAF50;
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    z-index: 1000;
    font-size: 0.9rem;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    animation: slideIn 0.3s ease-out;
  `;
    notification.textContent = `Session restored! ${dataPointCount} data points recovered.`;

    // Add animation
    const style = document.createElement('style');
    style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `;
    document.head.appendChild(style);

    document.body.appendChild(notification);

    // Remove notification after 5 seconds
    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
            if (style.parentNode) {
                style.parentNode.removeChild(style);
            }
        }, 300);
    }, 5000);
}

/**
 * Show a generic notification with custom message and type
 * @param {string} message - The message to display
 * @param {string} type - The type of notification ('success', 'error', 'info', 'warning')
 * @param {number} duration - Duration in milliseconds to show the notification
 */
export function showNotification(message, type = 'info', duration = 5000) {
    const colorMap = {
        success: '#4CAF50',
        error: '#f44336',
        warning: '#ff9800',
        info: '#2196F3'
    };

    const notification = document.createElement('div');
    notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${colorMap[type] || colorMap.info};
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

    // Add animation if not already added
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

    document.body.appendChild(notification);

    // Remove notification after specified duration
    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, duration);
}