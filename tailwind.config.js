/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./frontend/index.html",
        "./frontend/src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            // Color Palette - mapped from CSS variables
            colors: {
                primary: {
                    DEFAULT: '#0066cc',
                    dark: '#0052a3',
                    light: '#3385d6',
                },
                secondary: {
                    DEFAULT: '#2b2d42',
                    dark: '#23272e',
                    light: '#374151',
                },
                accent: {
                    DEFAULT: '#ff4500',
                    dark: '#e03e00',
                    light: '#ff6633',
                },
                success: {
                    DEFAULT: '#28a745',
                    dark: '#1e7e34',
                    light: '#48c774',
                },
                danger: {
                    DEFAULT: '#dc3545',
                    dark: '#b32b27',
                    light: '#e74c3c',
                },
                warning: {
                    DEFAULT: '#ffc107',
                    dark: '#b45309',
                    light: '#ffd54f',
                },
                info: {
                    DEFAULT: '#17a2b8',
                    dark: '#117a8b',
                    light: '#3498db',
                },
                // Neutral colors
                dark: '#333333',
                grey: {
                    DEFAULT: '#6c757d',
                    light: '#e9ecef',
                    lighter: '#f8f9fa',
                    dark: '#495057',
                },
                border: {
                    DEFAULT: '#dee2e6',
                    light: '#e9ecef',
                    dark: '#ced4da',
                },
                // Admin-specific colors
                admin: {
                    sidebar: {
                        start: '#23272e',
                        end: '#2b2d42',
                        text: '#ffffff',
                        link: '#e0e6ed',
                        active: '#ffffff',
                        border: '#374151',
                        icon: '#a3bffa',
                    },
                    content: '#f9fafb',
                    card: '#ffffff',
                    table: {
                        header: '#E0E0E0',
                        rowEven: '#f9fafb',
                        rowHover: '#f7fafd',
                    },
                },
                // Status colors
                status: {
                    processing: '#3498db',
                    confirmed: '#f1c40f',
                    shipped: '#9C27B0',
                    delivered: '#2ecc71',
                    cancelled: '#e74c3c',
                    active: '#4CAF50',
                    banned: '#F44336',
                },
            },

            // Spacing scale - mapped from --spacing-* variables
            spacing: {
                'xxs': '0.25rem',  // 4px
                'xs': '0.5rem',    // 8px
                'sm': '0.75rem',   // 12px
                'md': '1rem',      // 16px
                'lg': '1.5rem',    // 24px
                'xl': '2rem',      // 32px
                'xxl': '2.2rem',   // 35.2px
                'xxxl': '3rem',    // 48px
            },

            // Container configuration
            container: {
                center: true,
                padding: {
                    DEFAULT: '1rem',
                    sm: '1rem',
                    lg: '1rem',
                    xl: '1rem',
                    '2xl': '1rem',
                },
                screens: {
                    sm: '640px',
                    md: '768px',
                    lg: '1024px',
                    xl: '1280px',
                    '2xl': '1320px',
                },
            },

            // Font families
            fontFamily: {
                sans: ['Roboto', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Arial', 'sans-serif'],
                heading: ['Roboto', 'system-ui', 'sans-serif'],
                body: ['Roboto', 'sans-serif'],
            },

            // Font sizes - mapped from CSS variables
            fontSize: {
                'xs': ['0.75rem', { lineHeight: '1rem' }],      // 12px
                'sm': ['0.875rem', { lineHeight: '1.25rem' }],  // 14px
                'smed': ['0.9rem', { lineHeight: '1.35rem' }],  // 14.4px
                'base': ['1rem', { lineHeight: '1.5rem' }],     // 16px
                'md': ['1.08rem', { lineHeight: '1.62rem' }],   // 17.28px
                'lg': ['1.2rem', { lineHeight: '1.8rem' }],     // 19.2px
                'xl': ['1.3rem', { lineHeight: '1.95rem' }],    // 20.8px
                '2xl': ['1.5rem', { lineHeight: '2rem' }],      // 24px
                '3xl': ['1.7rem', { lineHeight: '2.25rem' }],   // 27.2px
                '4xl': ['2rem', { lineHeight: '2.5rem' }],      // 32px
                '5xl': ['2.5rem', { lineHeight: '3rem' }],      // 40px
            },

            // Font weights
            fontWeight: {
                light: '300',
                normal: '400',
                medium: '500',
                semibold: '600',
                bold: '700',
                extrabold: '800',
            },

            // Letter spacing
            letterSpacing: {
                tighter: '-0.05em',
                tight: '-0.025em',
                normal: '0',
                wide: '0.02em',
                wider: '0.05em',
                widest: '2px',
            },

            // Border radius - mapped from --border-radius-* variables
            borderRadius: {
                'none': '0',
                'sm': '0.25rem',   // 4px
                'md': '0.5rem',    // 8px
                'lg': '0.75rem',   // 12px
                'pill': '12px',
                'full': '9999px',
                'circle': '50%',
            },

            // Box shadows - mapped from --shadow-* variables
            boxShadow: {
                'sm': '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
                'md': '0 3px 6px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.12)',
                'lg': '0 10px 20px rgba(0, 0, 0, 0.15), 0 3px 6px rgba(0, 0, 0, 0.1)',
                'xl': '2px 0 16px 0 rgba(44, 62, 80, 0.1)',
                'focus': '0 0 0 3px rgba(33, 150, 243, 0.3)',
                'nav-active': '0 2px 12px 0 rgba(33, 150, 243, 0.08)',
                'mobile-toggle': '0 2px 10px rgba(0, 0, 0, 0.2)',
                'admin-md': '0 1px 6px rgba(0, 0, 0, 0.1)',
                'none': 'none',
            },

            // Transitions - mapped from --transition-* variables
            transitionDuration: {
                'short': '200ms',
                'medium': '300ms',
                'long': '500ms',
            },

            // Z-index scale
            zIndex: {
                '0': '0',
                '10': '10',
                '20': '20',
                '30': '30',
                '40': '40',
                '50': '50',
                'dropdown': '100',
                'sticky': '100',
                'fixed': '1000',
                'modal-backdrop': '1040',
                'modal': '1050',
                'popover': '1060',
                'tooltip': '1070',
                'toast': '9998',
                'pwa': '9999',
            },

            // Responsive breakpoints - matching existing media queries
            screens: {
                'xs': '400px',
                'sm': '576px',
                'md': '768px',
                'lg': '992px',
                'xl': '1200px',
                '2xl': '1400px',
            },

            // Grid template columns
            gridTemplateColumns: {
                'auto-fill-200': 'repeat(auto-fill, minmax(200px, 1fr))',
                'auto-fill-220': 'repeat(auto-fill, minmax(220px, 1fr))',
                'auto-fill-250': 'repeat(auto-fill, minmax(250px, 1fr))',
                'auto-fit-250': 'repeat(auto-fit, minmax(250px, 1fr))',
                'product': 'repeat(auto-fill, minmax(250px, 1fr))',
                'product-sm': 'repeat(auto-fill, minmax(200px, 1fr))',
                'product-xs': 'repeat(auto-fill, minmax(160px, 1fr))',
            },

            // Animation keyframes
            keyframes: {
                'fade-in': {
                    '0%': { opacity: '0', transform: 'translateY(-20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                'slide-in': {
                    '0%': { transform: 'translateX(100%)', opacity: '0' },
                    '100%': { transform: 'translateX(0)', opacity: '1' },
                },
                'slide-out': {
                    '0%': { transform: 'translateX(0)', opacity: '1' },
                    '100%': { transform: 'translateX(100%)', opacity: '0' },
                },
                'pulse': {
                    '0%': { boxShadow: '0 0 0 0 rgba(0, 102, 204, 0.4)' },
                    '70%': { boxShadow: '0 0 0 10px rgba(0, 102, 204, 0)' },
                    '100%': { boxShadow: '0 0 0 0 rgba(0, 102, 204, 0)' },
                },
            },

            // Animation utilities
            animation: {
                'fade-in': 'fade-in 0.5s ease-in-out',
                'slide-in': 'slide-in 0.3s ease-out',
                'slide-out': 'slide-out 0.3s ease-in',
                'pulse': 'pulse 2s infinite',
            },

            // Background images (for gradients)
            backgroundImage: {
                'gradient-sidebar': 'linear-gradient(180deg, #23272e 60%, #2b2d42 100%)',
                'gradient-primary': 'linear-gradient(90deg, #0066cc 60%, #0052a3 100%)',
            },

            // Max width
            maxWidth: {
                'container': '1320px',
            },

            // Line clamp
            lineClamp: {
                1: '1',
                2: '2',
                3: '3',
            },
        },
    },
    plugins: [
        // Add any custom plugins here
        function ({ addUtilities, addComponents }) {
            // Custom utilities for hover transforms
            addUtilities({
                '.hover-lift': {
                    '@apply transition-transform duration-short hover:-translate-y-1': {},
                },
                '.hover-scale': {
                    '@apply transition-transform duration-short hover:scale-105': {},
                },
            });

            // Custom component classes
            addComponents({
                '.btn-base': {
                    '@apply inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-base font-semibold cursor-pointer border border-transparent transition-all duration-short': {},
                },
                '.card-base': {
                    '@apply bg-white rounded-md shadow-md p-lg flex flex-col gap-md': {},
                },
                '.input-base': {
                    '@apply w-full px-3 py-2 text-base border border-border-light rounded-md transition-all duration-short focus:outline-none focus:border-primary focus:shadow-focus': {},
                },
            });
        },
    ],
}
