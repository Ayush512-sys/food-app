import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  const userString = localStorage.getItem('user');
  
  if (!token || !userString) {
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(userString);
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      // Role unauthorized
      return <Navigate to="/login" replace />;
    }
  } catch (e) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
