import { useEffect, useState, useCallback, useRef } from 'react';

/**
 * Custom hook for handling mobile navigation menu toggle.
 * 
 * Manages navigation menu visibility, icon switching (hamburger ↔ close),
 * and active state classes for mobile navigation.
 * 
 * @param {Object} options - Configuration options
 * @param {string} [options.navToggleSelector='.nav-toggle'] - CSS selector for toggle button
 * @param {string} [options.navListSelector='.nav-list'] - CSS selector for nav menu
 * @param {string} [options.mainNavSelector='.main-nav'] - CSS selector for nav container
 * 
 * @returns {Object} Hook API
 * @returns {boolean} isOpen - Whether the nav menu is currently open
 * @returns {Function} toggleNav - Function to toggle nav menu
 * @returns {Function} closeNav - Function to close nav menu
 * 
 * @example
 * // Basic usage - handles nav toggle automatically
 * function Header() {
 *   const { isOpen, toggleNav } = useNavToggle();
 * 
 *   return (
 *     <nav className="main-nav">
 *       <button className="nav-toggle" aria-expanded={isOpen}>
 *         <i className="fas fa-bars"></i>
 *       </button>
 *       <ul className="nav-list">
 *         <li><a href="/">Home</a></li>
 *         <li><a href="/about">About</a></li>
 *       </ul>
 *     </nav>
 *   );
 * }
 * 
 * @example
 * // With custom selectors
 * function MobileNav() {
 *   const { isOpen } = useNavToggle({
 *     navToggleSelector: '.mobile-menu-btn',
 *     navListSelector: '.mobile-menu',
 *     mainNavSelector: '.header-nav'
 *   });
 * 
 *   return <div className={isOpen ? 'menu-open' : ''}>...</div>;
 * }
 */
function useNavToggle(options = {}) {
    const {
        navToggleSelector = '.nav-toggle',
        navListSelector = '.nav-list',
        mainNavSelector = '.main-nav'
    } = options;

    const [isOpen, setIsOpen] = useState(false);
    const toggleButtonRef = useRef(null);
    const navListRef = useRef(null);
    const mainNavRef = useRef(null);

    /**
     * Toggles the hamburger/close icon classes
     * 
     * @param {HTMLElement} icon - The icon element
     * @param {boolean} shouldOpen - Whether menu should be opened
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
     * Updates DOM classes based on menu state
     * 
     * @param {boolean} shouldOpen - Whether menu should be opened
     */
    const updateMenuState = useCallback((shouldOpen) => {
        const navList = navListRef.current;
        const mainNav = mainNavRef.current;
        const toggleButton = toggleButtonRef.current;

        if (!navList) return;

        if (shouldOpen) {
            navList.classList.add('active');
            mainNav?.classList.add('menu-active');
        } else {
            navList.classList.remove('active');
            mainNav?.classList.remove('menu-active');
        }

        // Toggle icon
        const icon = toggleButton?.querySelector('i');
        toggleIcon(icon, shouldOpen);
    }, [toggleIcon]);

    /**
     * Toggles the navigation menu
     */
    const toggleNav = useCallback(() => {
        setIsOpen(prev => {
            const newState = !prev;
            updateMenuState(newState);
            return newState;
        });
    }, [updateMenuState]);

    /**
     * Closes the navigation menu
     */
    const closeNav = useCallback(() => {
        setIsOpen(false);
        updateMenuState(false);
    }, [updateMenuState]);

    // Effect: Setup toggle button listener and get DOM references
    useEffect(() => {
        const toggleButton = document.querySelector(navToggleSelector);
        const navList = document.querySelector(navListSelector);
        const mainNav = document.querySelector(mainNavSelector);

        if (!toggleButton || !navList) {
            console.warn(`useNavToggle: Required elements not found. Toggle: ${!!toggleButton}, NavList: ${!!navList}`);
            return;
        }

        // Store refs
        toggleButtonRef.current = toggleButton;
        navListRef.current = navList;
        mainNavRef.current = mainNav;

        // Attach click listener
        const handleClick = () => {
            toggleNav();
        };

        toggleButton.addEventListener('click', handleClick);

        // Cleanup
        return () => {
            toggleButton.removeEventListener('click', handleClick);
        };
    }, [navToggleSelector, navListSelector, mainNavSelector, toggleNav]);

    return {
        isOpen,
        toggleNav,
        closeNav
    };
}

export default useNavToggle;
