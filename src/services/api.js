import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ===== Auth =====
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
};

// ===== Admin =====
export const adminAPI = {
  // Stats & Activity
  getStats: () => api.get('/admin/stats'),
  getActivityLogs: () => api.get('/admin/activity-logs'),

  // Users
  getUsers: (params) => api.get('/admin/users', { params }),
  getUserById: (id) => api.get(`/admin/users/${id}`),
  updateUserStatus: (id, status) =>
    api.put(`/admin/users/${id}/status`, { status }),
  getUserFamilyMembers: (userId) =>
    api.get(`/admin/users/${userId}/family-members`),

  // Ingredients
  getIngredients: (params) => api.get('/admin/ingredients', { params }),
  getIngredientById: (id) => api.get(`/admin/ingredients/${id}`),
  createIngredient: (data) => api.post('/admin/ingredients', data),
  updateIngredient: (id, data) => api.put(`/admin/ingredients/${id}`, data),
  deleteIngredient: (id) => api.delete(`/admin/ingredients/${id}`),

  // Recipes
  getRecipes: (params) => api.get('/admin/recipes', { params }),
  getRecipeById: (id) => api.get(`/admin/recipes/${id}`),
  createRecipe: (data) => api.post('/admin/recipes', data),
  updateRecipe: (id, data) => api.put(`/admin/recipes/${id}`, data),
  updateRecipeStatus: (id, status) =>
    api.put(`/admin/recipes/${id}/status`, { status }),
  deleteRecipe: (id) => api.delete(`/admin/recipes/${id}`),

  // Orders
  getOrders: (params) => api.get('/admin/orders', { params }),
  getOrderById: (id) => api.get(`/admin/orders/${id}`),
  updateOrderStatus: (id, status) =>
    api.put(`/admin/orders/${id}/status`, { status }),

  // Health Conditions
  getHealthConditions: (params) => api.get('/admin/health-conditions', { params }),
  createHealthCondition: (data) => api.post('/admin/health-conditions', data),
  updateHealthCondition: (id, data) => api.put(`/admin/health-conditions/${id}`, data),
  deleteHealthCondition: (id) => api.delete(`/admin/health-conditions/${id}`),

  // Dish Categories
  getDishCategories: (params) => api.get('/admin/dish-categories', { params }),
  createDishCategory: (data) => api.post('/admin/dish-categories', data),
  updateDishCategory: (id, data) => api.put(`/admin/dish-categories/${id}`, data),
  deactivateDishCategory: (id) => api.put(`/admin/dish-categories/${id}/deactivate`),
};

export default api;
