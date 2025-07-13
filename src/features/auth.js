import { apiService } from '../services/api.js';
import { User } from '../types/index.js';

class AuthService {
    constructor() {
        this.currentUser = null;
        this.token = localStorage.getItem('auth_token');
    }
    
    async login(email, password) {
        try {
            const response = await apiService.post('/auth/login', { email, password });
            this.token = response.token;
            this.currentUser = new User(response.user.id, response.user.name, response.user.email);
            localStorage.setItem('auth_token', this.token);
            return this.currentUser;
        } catch (error) {
            throw new Error('Login failed: ' + error.message);
        }
    }
    
    async logout() {
        try {
            await apiService.post('/auth/logout', {});
        } catch (error) {
            console.warn('Logout request failed:', error);
        } finally {
            this.token = null;
            this.currentUser = null;
            localStorage.removeItem('auth_token');
        }
    }
    
    async register(name, email, password) {
        try {
            const response = await apiService.post('/auth/register', { name, email, password });
            this.token = response.token;
            this.currentUser = new User(response.user.id, response.user.name, response.user.email);
            localStorage.setItem('auth_token', this.token);
            return this.currentUser;
        } catch (error) {
            throw new Error('Registration failed: ' + error.message);
        }
    }
    
    isAuthenticated() {
        return !!this.token && !!this.currentUser;
    }
    
    getCurrentUser() {
        return this.currentUser;
    }
    
    getToken() {
        return this.token;
    }
}

export const authService = new AuthService();
export default AuthService; 