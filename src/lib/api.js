const API_URL = 'http://localhost:5000/api';
async function request(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers,
    };
    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'An error occurred' }));
        throw new Error(error.message || 'Request failed');
    }
    return response.json();
}
export const api = {
    auth: {
        signup: (data) => request('/auth/signup', { method: 'POST', body: JSON.stringify(data) }),
        signin: (data) => request('/auth/signin', { method: 'POST', body: JSON.stringify(data) }),
        getMe: () => request('/auth/me'),
    },
    orders: {
        getAll: () => request('/orders'),
        create: (data) => request('/orders', { method: 'POST', body: JSON.stringify(data) }),
        update: (id, data) => request(`/orders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        delete: (id) => request(`/orders/${id}`, { method: 'DELETE' }),
    },
    costs: {
        getAll: () => request('/costs'),
        getByOrder: (orderId) => request(`/costs/order/${orderId}`),
        create: (data) => request('/costs', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
        delete: (id) => request(`/costs/${id}`, {
            method: 'DELETE',
        }),
    },
    productSheets: {
        getAll: () => request('/product-sheets'),
        save: (data) => request('/product-sheets', { method: 'POST', body: JSON.stringify(data) }),
        delete: (id) => request(`/product-sheets/${id}`, { method: 'DELETE' }),
    },
    company: {
        getEmployees: () => request('/company/employees'),
        addEmployee: (data) => request('/company/employees', { method: 'POST', body: JSON.stringify(data) }),
        deleteEmployee: (id) => request(`/company/employees/${id}`, { method: 'DELETE' }),
        getExpenses: () => request('/company/expenses'),
        addExpense: (data) => request('/company/expenses', { method: 'POST', body: JSON.stringify(data) }),
        deleteExpense: (id) => request(`/company/expenses/${id}`, { method: 'DELETE' }),
    },
    insights: {
        generate: (stats) => request('/insights', {
            method: 'POST',
            body: JSON.stringify({ stats }),
        }),
    },
};
