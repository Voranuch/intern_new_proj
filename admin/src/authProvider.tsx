import { AuthProvider } from 'react-admin';
import axios, { AxiosError } from 'axios';

export const authProvider: AuthProvider = {
    login: async ({ username, password }) => {
        try {
            const response = await axios.post('http://localhost:8081/admin-login', { 
                username, 
                password 
            });
            console.log(response.data);

            // Check if the response data and user are defined
            if (response.data && response.data.token && response.data.username && response.data.role) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('username', response.data.username); // Directly access username from response.data
                localStorage.setItem('role', response.data.role); // Directly access role from response.data
                return Promise.resolve();
            } else {
                return Promise.reject('Invalid credentials or missing user data');
            }
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                // Log the error response and status code
                console.error('Axios Error:', error.response?.data);
                console.error('Status:', error.response?.status);
                console.error('Message:', error.response?.statusText);
                return Promise.reject(error.response?.data?.message || 'Login failed');
            } else {
                console.error('Unexpected Error:', error);
                return Promise.reject('An unexpected error occurred');
            }
        }
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('role');
        return Promise.resolve();
    },

    checkError: ({ status }) => {
        if (status === 401 || status === 403) {
            localStorage.removeItem('token');
            return Promise.reject();
        }
        return Promise.resolve();
    },

    checkAuth: () => {
        const token = localStorage.getItem('token');
        if (token) {
            return Promise.resolve();
        } else {
            console.warn('No token found, redirecting to login...');
            return Promise.reject();
        }
    },    

    getPermissions: () => {
        const role = localStorage.getItem('role');
        return Promise.resolve(role);
    }
};
