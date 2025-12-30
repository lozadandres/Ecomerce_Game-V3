import React from 'react';
import { Link, Outlet } from 'react-router-dom';

const Dashboard = () => {
  return (
    <div className="dashboard">
      <nav className="sidebar">
        <h3>Panel de Administrador</h3>
        <ul>
          <li><Link to="productos">Gestionar Productos</Link></li>
          <li><Link to="usuarios">Gestionar Usuarios</Link></li>
          <li><Link to="categorias">Gestionar Categorías</Link></li>
        </ul>
      </nav>
      <main>
        <Outlet />
      </main>
    </div>
  );
};

export default Dashboard;
