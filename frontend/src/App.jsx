import React from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Catalogo from './pages/Catalogo';
import DetalleProducto from './pages/DetalleProducto';
import CarritoCompra from './pages/CarritoCompra';
import Dashboard from './pages/Dashboard';
import DashboardProductos from './components/DashboardProductos';
import DashboardUsuarios from './components/DashboardUsuarios';
import DashboardCategorias from './components/DashboardCategorias';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import AiChatAssistant from './components/AiChatAssistant';

const App = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <nav className="navbar">
        <Link to="/">EpicPlay Store</Link>
        <div>
          <Link to="/catalogo">Catálogo</Link>
          <Link to="/carrito">Carrito</Link>
          {user && user.isAdmin && <Link to="/dashboard">Dashboard</Link>}
          {user ? (
            <button onClick={handleLogout}>Logout</button>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/signup">Registro</Link>
            </>
          )}
        </div>
      </nav>
      <main className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/catalogo" element={<Catalogo />} />
          <Route path="/producto/:id" element={<DetalleProducto />} />
          <Route path="/carrito" element={<CarritoCompra />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>}>
            <Route index element={<DashboardProductos />} />
            <Route path="productos" element={<DashboardProductos />} />
            <Route path="usuarios" element={<DashboardUsuarios />} />
            <Route path="categorias" element={<DashboardCategorias />} />
          </Route>
        </Routes>
      </main>
      <footer className="footer">
        <div className="footer-content">
          <p>&copy; 2025 EpicPlay Store. Todos los derechos reservados.</p>
          <div className="footer-links">
            <a href="#">Términos y Condiciones</a>
            <a href="#">Política de Privacidad</a>
            <a href="#">Contacto</a>
          </div>
        </div>
      </footer>
      <AiChatAssistant />
    </>
  );
};

export default App;
