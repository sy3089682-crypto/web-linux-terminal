import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import IDEPage from './pages/IDEPage';
import BillingPage from './pages/BillingPage';
import './App.css';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
    const auth = useAuth();
    if (!auth || auth.loading) return null;
    return auth.token ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
    return (
        <ErrorBoundary>
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Login />} />
                    <Route 
                        path="/dashboard" 
                        element={
                            <PrivateRoute>
                                <Dashboard />
                            </PrivateRoute>
                        } 
                    />
                    <Route 
                        path="/terminal/:id" 
                        element={
                            <PrivateRoute>
                                <IDEPage />
                            </PrivateRoute>
                        } 
                    />
                    <Route 
                        path="/billing" 
                        element={
                            <PrivateRoute>
                                <BillingPage />
                            </PrivateRoute>
                        } 
                    />
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </Router>
        </AuthProvider>
        </ErrorBoundary>
    );
}

export default App;
