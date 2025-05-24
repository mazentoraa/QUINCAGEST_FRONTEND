import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Spin } from 'antd'; // Import Spin for loading indicator

const PrivateRoute = () => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        // You can return a global loading spinner or a more specific one
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <Spin size="large" />
            </div>
        );
    }

    return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;