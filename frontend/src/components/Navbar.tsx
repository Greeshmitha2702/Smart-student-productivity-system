import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

const navItems = [
  { path: '/', label: 'Home' },
  { path: '/tasks', label: 'Tasks' },
  { path: '/planner', label: 'Planner' },
  { path: '/analytics', label: 'Analytics' },
];

export default function Navbar() {
  const location = useLocation();
  return (
    <nav className="navbar">
      {navItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={
            'navbar-link' + (location.pathname === item.path ? ' active' : '')
          }
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
