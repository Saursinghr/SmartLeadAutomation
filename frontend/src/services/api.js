import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
    timeout: 30000, // 30 seconds for batch processing
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        // You can add auth tokens here if needed
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    (response) => {
        return response.data;
    },
    (error) => {
        // Handle errors globally
        const message = error.response?.data?.error || error.message || 'An error occurred';
        console.error('API Error:', message);
        return Promise.reject(error);
    }
);

/**
 * Lead API Service
 */
export const leadAPI = {
    /**
     * Process a batch of names
     * @param {string[] | string} names - Array of names or comma-separated string
     */
    processBatch: async (names) => {
        return api.post('/api/leads/process', { names });
    },

    /**
     * Get all leads with optional filtering
     * @param {Object} params - Query parameters
     */
    getLeads: async (params = {}) => {
        return api.get('/api/leads', { params });
    },

    /**
     * Get a single lead by ID
     * @param {string} id - Lead ID
     */
    getLeadById: async (id) => {
        return api.get(`/api/leads/${id}`);
    },

    /**
     * Get statistics
     */
    getStats: async () => {
        return api.get('/api/leads/stats');
    },

    /**
     * Delete all leads (development only)
     */
    deleteAll: async () => {
        return api.delete('/api/leads');
    },
};

export default api;
