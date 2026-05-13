import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TerminalPage from './pages/TerminalPage';
import './App.css';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
    const { token, loading } = useAuth();
    if (loading) return null;
    return token ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Login />} /> {/* Using same component for now */}
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
                                <TerminalPage />
                            </PrivateRoute>
                        } 
                    />
                    <Route path="*" element={<Navigate to="/dashboard" />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
