import axios from 'axios';

// Create axios instance with default config
const apiClient = axios.create({
    withCredentials: true, // for cookies/session
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor
apiClient.interceptors.request.use(
    (config) => {
        // You can add auth token here if needed in the future
        // const token = localStorage.getItem('token');
        // if (token) {
        //   config.headers.Authorization = `Bearer ${token}`;
        // }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor
apiClient.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // Handle common errors
        if (error.response) {
            switch (error.response.status) {
                case 401:
                    // Unauthorized - redirect to login
                    console.error('Unauthorized access');
                    window.location.href = '/auth/login';
                    break;
                case 403:
                    // Forbidden
                    console.error('Access forbidden');
                    break;
                case 404:
                    // Not found
                    console.error('Resource not found');
                    break;
                case 500:
                    // Server error
                    console.error('Server error');
                    break;
                default:
                    console.error('API error:', error.response.data);
            }
        } else if (error.request) {
            // Request made but no response
            console.error('No response from server');
        } else {
            // Something else happened
            console.error('Error:', error.message);
        }
        return Promise.reject(error);
    }
);

export default apiClient;
