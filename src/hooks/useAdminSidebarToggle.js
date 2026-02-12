import { useEffect, useState, useCallback, useRef } from 'react';

/**
 * Custom hook for managing admin sidebar visibility on mobile devices.
 * 
 * Handles sidebar toggle with icon switching, outside-click detection to close,
 * automatic closure on window resize (when viewport exceeds breakpoint),
 * and proper event propagation control.
 * 
 * @param {Object} options - Configuration options
 * @param {string} [options.mobileToggleSelector='.mobile-toggle'] - CSS selector for toggle button
 * @param {string} [options.sidebarSelector='.admin-sidebar'] - CSS selector for sidebar
 * @param {number} [options.breakpoint=768] - Breakpoint width (px) for mobile/desktop
 * 
 * @returns {Object} Hook API
 * @returns {boolean} isOpen - Whether the sidebar is currently open
 * @returns {Function} toggleSidebar - Function to toggle sidebar
 * @returns {Function} closeSidebar - Function to close sidebar
 * 
 * @example
 * // Basic usage - handles admin sidebar automatically
 * function AdminLayout() {
 *   const { isOpen, toggleSidebar } = useAdminSidebarToggle();
 * 
 *   return (
 *     <div className="admin-container">
 *       <button className="mobile-toggle" aria-expanded={isOpen}>
 *         <i className="fas fa-bars"></i>
 *       </button>
 *       <aside className="admin-sidebar">
 *         <nav>...</nav>
 *       </aside>
 *       <main className="admin-content">...</main>
 *     </div>
 *   );
 * }
 * 
 * @example
 * // With custom breakpoint
 * function Dashboard() {
 *   const { isOpen, closeSidebar } = useAdminSidebarToggle({
 *     breakpoint: 1024,
 *     sidebarSelector: '.dashboard-sidebar'
 *   });
 * 
 *   // Programmatically close sidebar
 *   const handleNavigation = () => {
 *     closeSidebar();
 *   };
 * 
 *   return <div>...</div>;
 * }
 */
function useAdminSidebarToggle(options = {}) {
    const {
        mobileToggleSelector = '.mobile-toggle',
        sidebarSelector = '.admin-sidebar',
        breakpoint = 768
    } = options;

    const [isOpen, setIsOpen] = useState(false);
    const mobileToggleRef = useRef(null);
    const sidebarRef = useRef(null);

    /**
     * Toggles the hamburger/close icon classes
     * 
     * @param {HTMLElement} icon - The icon element
     * @param {boolean} shouldOpen - Whether sidebar should be opened
     */
    const toggleIcon = useCallback((icon, shouldOpen) => {
        if (!icon) return;

        if (shouldOpen) {
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-times');
        } else {
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        }
    }, []);

    /**
     * Updates sidebar visibility in DOM
     * 
     * @param {boolean} shouldOpen - Whether sidebar should be opened
     */
    const updateSidebarState = useCallback((shouldOpen) => {
        const sidebar = sidebarRef.current;
        const mobileToggle = mobileToggleRef.current;

        if (!sidebar) return;

        if (shouldOpen) {
            sidebar.classList.add('show');
        } else {
            sidebar.classList.remove('show');
        }

        // Toggle icon
        const icon = mobileToggle?.querySelector('i');
        toggleIcon(icon, shouldOpen);
    }, [toggleIcon]);

    /**
     * Toggles the sidebar
     */
    const toggleSidebar = useCallback(() => {
        setIsOpen(prev => {
            const newState = !prev;
            updateSidebarState(newState);
            return newState;
        });
    }, [updateSidebarState]);

    /**
     * Closes the sidebar
     */
    const closeSidebar = useCallback(() => {
        setIsOpen(false);
        updateSidebarState(false);
    }, [updateSidebarState]);

    // Effect: Setup all sidebar interactions
    useEffect(() => {
        const mobileToggle = document.querySelector(mobileToggleSelector);
        const sidebar = document.querySelector(sidebarSelector);

        if (!mobileToggle || !sidebar) {
            console.warn(`useAdminSidebarToggle: Required elements not found. Toggle: ${!!mobileToggle}, Sidebar: ${!!sidebar}`);
            return;
        }

        // Store refs
        mobileToggleRef.current = mobileToggle;
        sidebarRef.current = sidebar;

        /**
         * Handle toggle button click
         */
        const handleToggleClick = (e) => {
            e.stopPropagation(); // Prevent event from bubbling to document
            toggleSidebar();
        };

        /**
         * Handle clicks outside sidebar (close sidebar)
         */
        const handleDocumentClick = (e) => {
            // Check if sidebar is open and click is outside both sidebar and toggle button
            if (
                isOpen &&
                !sidebar.contains(e.target) &&
                e.target !== mobileToggle &&
                !mobileToggle.contains(e.target)
            ) {
                closeSidebar();
            }
        };

        /**
         * Prevent sidebar clicks from bubbling to document
         */
        const handleSidebarClick = (e) => {
            e.stopPropagation();
        };

        /**
         * Close sidebar when resizing to desktop view
         */
        const handleResize = () => {
            if (window.innerWidth > breakpoint && isOpen) {
                closeSidebar();
            }
        };

        // Attach event listeners
        mobileToggle.addEventListener('click', handleToggleClick);
        document.addEventListener('click', handleDocumentClick);
        sidebar.addEventListener('click', handleSidebarClick);
        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
            mobileToggle.removeEventListener('click', handleToggleClick);
            document.removeEventListener('click', handleDocumentClick);
            sidebar.removeEventListener('click', handleSidebarClick);
            window.removeEventListener('resize', handleResize);
        };
    }, [
        mobileToggleSelector,
        sidebarSelector,
        breakpoint,
        isOpen,
        toggleSidebar,
        closeSidebar
    ]);

    return {
        isOpen,
        toggleSidebar,
        closeSidebar
    };
}

export default useAdminSidebarToggle;
