const API_URL = 'http://localhost:5000';

const request = async (endpoint, method = 'GET', body = null, headers = {}, isFormData = false) => {
  console.log(`API Request: ${method} ${endpoint}`, { headers, isFormData });
  
  // Obtener token de localStorage
  const user = JSON.parse(localStorage.getItem('user')); // Asumimos que guardamos todo el objeto user
  const token = user?.token;

  const config = {
    method,
    headers: {
      ...headers,
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
  };

  if (isFormData) {
    config.body = body;
    console.log('Sending FormData');
  } else if (body) {
    config.headers['Content-Type'] = 'application/json';
    config.body = JSON.stringify(body);
    console.log('Sending JSON:', body);
  }

  try {
    console.log('Fetch config:', { url: `${API_URL}${endpoint}`, method, headers: config.headers });
    const response = await fetch(`${API_URL}${endpoint}`, config);
    console.log('Response status:', response.status, response.statusText);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      console.log('Response not OK, trying to parse error...');
      const contentType = response.headers.get('content-type');
      console.log('Error response content-type:', contentType);
      
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        console.error('Error response (JSON):', errorData);
        throw new Error(errorData.message || 'Something went wrong');
      } else {
        const errorText = await response.text();
        console.error('Error response (Text):', errorText);
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }
    }
    if (response.status === 204) {
        return null;
    }
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const result = await response.json();
      console.log('Response data:', result);
      return result;
    } else {
      const textResult = await response.text();
      console.log('Response text:', textResult);
      throw new Error('Expected JSON response but got: ' + contentType);
    }
  } catch (error) {
    console.error(`API Error (${method} ${endpoint}):`, error);
    throw error;
  }
};

// Auth
export const login = (credentials) => request('/login', 'POST', credentials);
export const register = (userData) => request('/registro', 'POST', userData);

// Products
export const getProductos = () => request('/productos');
export const getProductoById = (id) => request(`/productos/${id}`);
export const createProducto = (data) => request('/productos', 'POST', data, {}, true);
export const updateProducto = (id, data) => request(`/productos/${id}`, 'PUT', data, {}, true);
export const deleteProducto = (id) => request(`/productos/${id}`, 'DELETE');

// Categories
export const getCategorias = () => request('/categorias');
export const createCategoria = (data) => request('/categorias', 'POST', data);
export const updateCategoria = (id, data) => request(`/categorias/${id}`, 'PUT', data);
export const deleteCategoria = (id) => request(`/categorias/${id}`, 'DELETE');

// Cart
export const getCarrito = (usuarioId) => request(`/carrito/${usuarioId}`);
export const addToCarrito = (usuarioId, productoId, quantity) => request(`/carrito/${usuarioId}`, 'POST', { productoId, quantity });
export const updateCarrito = (usuarioId, productoId, quantity) => request(`/carrito/${usuarioId}`, 'PUT', { productoId, quantity });
export const removeFromCarrito = (usuarioId, productoId) => request(`/carrito/${usuarioId}/${productoId}`, 'DELETE');
export const clearCarrito = (usuarioId) => request(`/carrito/${usuarioId}`, 'DELETE');

// Users (Admin)
export const getUsuarios = () => request('/usuarios', 'GET');
export const createUsuario = (data) => request('/usuarios', 'POST', data);
export const updateUsuario = (id, data) => request(`/usuarios/${id}`, 'PUT', data);
export const deleteUsuario = (id) => request(`/usuarios/${id}`, 'DELETE');
// AI
export const getRecommendations = (cartItems) => request('/api/recommendations', 'POST', { cartItems });
export const processChat = (data) => request('/api/ai/chat', 'POST', data);
