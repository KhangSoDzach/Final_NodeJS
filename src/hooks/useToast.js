import { useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for managing toast notifications.
 * 
 * Handles auto-showing toasts on mount, auto-dismissing after a configurable delay,
 * manual close via close buttons, and programmatic toast creation.
 * 
 * @param {Object} options - Configuration options
 * @param {number} [options.autoDismissDelay=5000] - Auto-dismiss delay in milliseconds
 * @param {string} [options.position='top-right'] - Toast container position
 * @param {string} [options.toastSelector='.toast'] - CSS selector for toast elements
 * @param {string} [options.closeButtonSelector='.toast-close'] - CSS selector for close buttons
 * 
 * @returns {Object} Hook API
 * @returns {Function} showToast - Function to programmatically show a toast
 * 
 * @example
 * // Basic usage in a component
 * function MyComponent() {
 *   const { showToast } = useToast({ autoDismissDelay: 5000 });
 * 
 *   const handleSuccess = () => {
 *     showToast('success', 'Operation completed successfully!');
 *   };
 * 
 *   return <button onClick={handleSuccess}>Save</button>;
 * }
 * 
 * @example
 * // With custom configuration
 * function App() {
 *   useToast({
 *     autoDismissDelay: 3000,
 *     position: 'bottom-right',
 *     toastSelector: '.custom-toast'
 *   });
 * 
 *   return <div>...</div>;
 * }
 */
function useToast(options = {}) {
    const {
        autoDismissDelay = 5000,
        position = 'top-right',
        toastSelector = '.toast',
        closeButtonSelector = '.toast-close'
    } = options;

    const timersRef = useRef(new Set());

    /**
     * Shows existing toast elements in the DOM
     */
    const showExistingToasts = useCallback(() => {
        const toasts = document.querySelectorAll(toastSelector);

        toasts.forEach(toast => {
            // Add show class to make toast visible
            toast.classList.add('show');

            // Auto-dismiss after delay
            const timer = setTimeout(() => {
                toast.classList.remove('show');
            }, autoDismissDelay);

            timersRef.current.add(timer);
        });
    }, [toastSelector, autoDismissDelay]);

    /**
     * Attaches close button event listeners
     */
    const attachCloseListeners = useCallback(() => {
        const closeButtons = document.querySelectorAll(closeButtonSelector);

        const handleClose = (event) => {
            const toast = event.currentTarget.closest(toastSelector);
            if (toast) {
                toast.classList.remove('show');
            }
        };

        closeButtons.forEach(button => {
            button.addEventListener('click', handleClose);
        });

        // Return cleanup function
        return () => {
            closeButtons.forEach(button => {
                button.removeEventListener('click', handleClose);
            });
        };
    }, [toastSelector, closeButtonSelector]);

    /**
     * Programmatically creates and shows a toast notification
     * 
     * @param {('success'|'error'|'warning'|'info')} type - Toast type
     * @param {string} message - Toast message content
     */
    const showToast = useCallback((type, message) => {
        // Check if toast container exists, if not create one
        let toastContainer = document.querySelector('.toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.className = 'toast-container';
            toastContainer.style.cssText = `position: fixed; top: 20px; right: 20px; z-index: 9999;`;

            // Adjust position based on configuration
            if (position === 'bottom-right') {
                toastContainer.style.cssText = `position: fixed; bottom: 20px; right: 20px; z-index: 9999;`;
            } else if (position === 'top-left') {
                toastContainer.style.cssText = `position: fixed; top: 20px; left: 20px; z-index: 9999;`;
            } else if (position === 'bottom-left') {
                toastContainer.style.cssText = `position: fixed; bottom: 20px; left: 20px; z-index: 9999;`;
            }

            document.body.appendChild(toastContainer);
        }

        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        // Icon mapping
        const iconMap = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };

        // Color mapping
        const colorMap = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };

        toast.style.cssText = `
      background: ${colorMap[type] || '#3b82f6'};
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      margin-bottom: 10px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
      display: flex;
      align-items: center;
      gap: 10px;
      animation: slideIn 0.3s ease;
    `;

        toast.innerHTML = `
      <i class="fas ${iconMap[type] || 'fa-info-circle'}"></i>
      <span>${message}</span>
      <button onclick="this.parentElement.remove()" style="background:none;border:none;color:white;cursor:pointer;margin-left:10px;">
        <i class="fas fa-times"></i>
      </button>
    `;

        toastContainer.appendChild(toast);

        // Auto remove after delay
        const timer = setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            const removeTimer = setTimeout(() => toast.remove(), 300);
            timersRef.current.add(removeTimer);
        }, autoDismissDelay);

        timersRef.current.add(timer);
    }, [autoDismissDelay, position]);

    // Main effect: Setup toast handling on mount
    useEffect(() => {
        showExistingToasts();
        const cleanup = attachCloseListeners();

        // Cleanup function
        return () => {
            // Clear all timers
            timersRef.current.forEach(timer => clearTimeout(timer));
            timersRef.current.clear();

            // Run close listener cleanup
            if (cleanup) cleanup();
        };
    }, [showExistingToasts, attachCloseListeners]);

    return { showToast };
}

export default useToast;
