import { useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for handling server-rendered flash alert messages.
 * 
 * Manages flash messages with auto-scroll to top, visibility animations,
 * auto-hide after a configurable delay, and manual close functionality.
 * 
 * @param {Object} options - Configuration options
 * @param {string} [options.selector='.alert'] - CSS selector for alert elements
 * @param {string} [options.closeButtonSelector='.close-alert'] - CSS selector for close buttons
 * @param {number} [options.autoHideDuration=5000] - Auto-hide delay in milliseconds
 * @param {boolean} [options.scrollToTop=true] - Whether to scroll to top when alerts present
 * @param {number} [options.fadeDuration=500] - Fade out animation duration in milliseconds
 * 
 * @example
 * // Basic usage - handles all alerts on the page
 * function App() {
 *   useFlashAlerts();
 *   
 *   return (
 *     <div>
 *       {/* Server-rendered alerts will be handled automatically */}
 * <div className="alert alert-success">
    *         <span>Success message</span>
    *         <button className="close-alert">×</button>
    *       </div>
    *     </div >
 *   );
 * }
 * 
 * @example
    * // With custom configuration
 * function Layout() {
 * useFlashAlerts({
        *     selector: '.flash-message',
        *     autoHideDuration: 3000,
        *     scrollToTop: false
 *   });
 * 
 *   return <div>...</div>;
 * }
    */
function useFlashAlerts(options = {}) {
    const {
        selector = '.alert',
        closeButtonSelector = '.close-alert',
        autoHideDuration = 5000,
        scrollToTop = true,
        fadeDuration = 500
    } = options;

    const timersRef = useRef(new Set());

    /**
     * Fades out and removes an alert element
     * 
     * @param {HTMLElement} alert - The alert element to hide
     */
    const hideAlert = useCallback((alert) => {
        if (!alert) return;

        // Start fade out animation
        alert.style.opacity = '0';

        // Remove from DOM after fade completes
        const timer = setTimeout(() => {
            alert.style.display = 'none';
        }, fadeDuration);

        timersRef.current.add(timer);
    }, [fadeDuration]);

    /**
     * Sets up auto-hide timer for an alert
     * 
     * @param {HTMLElement} alert - The alert element
     */
    const setupAutoHide = useCallback((alert) => {
        const timer = setTimeout(() => {
            hideAlert(alert);
        }, autoHideDuration);

        timersRef.current.add(timer);
    }, [autoHideDuration, hideAlert]);

    /**
     * Initializes flash alerts in the DOM
     */
    const initializeAlerts = useCallback(() => {
        const alerts = document.querySelectorAll(selector);

        if (alerts.length === 0) return null;

        // Scroll to top if alerts are present
        if (scrollToTop) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        // Process each alert
        alerts.forEach(alert => {
            // Add visible class for animation
            alert.classList.add('alert-visible');

            // Setup auto-hide
            setupAutoHide(alert);
        });

        return alerts;
    }, [selector, scrollToTop, setupAutoHide]);

    /**
     * Attaches close button event listeners
     */
    const attachCloseListeners = useCallback(() => {
        const closeButtons = document.querySelectorAll(`${selector} ${closeButtonSelector}`);

        const handleClose = (event) => {
            const alert = event.currentTarget.closest(selector);
            if (alert) {
                // Clear any existing auto-hide timer for this alert
                hideAlert(alert);
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
    }, [selector, closeButtonSelector, hideAlert]);

    // Main effect: Initialize alerts and attach listeners on mount
    useEffect(() => {
        // Debug logging (matches original main.js)
        console.log('Flash messages in DOM:', {
            success: document.querySelectorAll('.alert-success').length > 0,
            error: document.querySelectorAll('.alert-danger').length > 0
        });

        initializeAlerts();
        const cleanup = attachCloseListeners();

        // Cleanup function
        return () => {
            // Clear all timers
            timersRef.current.forEach(timer => clearTimeout(timer));
            timersRef.current.clear();

            // Run close listener cleanup
            if (cleanup) cleanup();
        };
    }, [initializeAlerts, attachCloseListeners]);
}

export default useFlashAlerts;
