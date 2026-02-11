/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            // Color Palette
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
            },
            
            // Spacing
            spacing: {
                'xxs': '0.25rem',
                'xs': '0.5rem',
                'sm': '0.75rem',
                'md': '1rem',
                'lg': '1.5rem',
                'xl': '2rem',
                'xxl': '2.2rem',
                'xxxl': '3rem',
            },

            // Container
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
                sans: ['Roboto', 'system-ui', '-apple-system', 'sans-serif'],
                heading: ['Roboto', 'system-ui', 'sans-serif'],
                body: ['Roboto', 'sans-serif'],
            },

            // Font sizes
            fontSize: {
                'xs': ['0.75rem', { lineHeight: '1rem' }],
                'sm': ['0.875rem', { lineHeight: '1.25rem' }],
                'base': ['1rem', { lineHeight: '1.5rem' }],
                'lg': ['1.2rem', { lineHeight: '1.8rem' }],
                'xl': ['1.3rem', { lineHeight: '1.95rem' }],
                '2xl': ['1.5rem', { lineHeight: '2rem' }],
                '3xl': ['1.7rem', { lineHeight: '2.25rem' }],
                '4xl': ['2rem', { lineHeight: '2.5rem' }],
                '5xl': ['2.5rem', { lineHeight: '3rem' }],
            },

            // Border radius
            borderRadius: {
                'sm': '0.25rem',
                'md': '0.5rem',
                'lg': '0.75rem',
                'pill': '12px',
                'full': '9999px',
            },

            // Box shadows
            boxShadow: {
                'sm': '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
                'md': '0 3px 6px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.12)',
                'lg': '0 10px 20px rgba(0, 0, 0, 0.15), 0 3px 6px rgba(0, 0, 0, 0.1)',
                'xl': '2px 0 16px 0 rgba(44, 62, 80, 0.1)',
            },

            // Z-index
            zIndex: {
                'sticky': '100',
                'dropdown': '1000',
                'modal': '1050',
                'tooltip': '1100',
            },
        },
    },
    plugins: [],
}
