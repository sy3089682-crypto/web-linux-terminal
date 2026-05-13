import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Terminal, Github } from 'lucide-react';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login, setAuth } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const token = params.get('token');
        if (token) {
            setAuth(token, {}); // Backend should ideally send user info or we fetch it
            navigate('/dashboard');
        }
    }, [location, setAuth, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await login(username, password);
            navigate('/dashboard');
        } catch (err) {
            setError('Invalid credentials');
        }
    };

    const handleGitHubLogin = () => {
        window.location.href = 'http://localhost:3001/api/auth/github';
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 text-white font-sans">
            <div className="w-full max-w-md bg-[#111] border border-gray-800 rounded-2xl p-8 shadow-2xl">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-4">
                        <Terminal size={28} />
                    </div>
                    <h1 className="text-2xl font-bold">Welcome Back</h1>
                    <p className="text-gray-500 text-sm mt-2 text-center">Enter your credentials to access your billion-dollar workspace</p>
                </div>

                {error && <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-2 rounded-lg text-sm mb-6 text-center">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Username</label>
                        <input 
                            type="text" 
                            className="w-full bg-black border border-gray-800 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-600 transition-all"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Password</label>
                        <input 
                            type="password" 
                            className="w-full bg-black border border-gray-800 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-600 transition-all"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-bold shadow-lg shadow-blue-600/20 transition-all active:scale-95">
                        Log In
                    </button>
                </form>

                <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-800"></div></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#111] px-2 text-gray-500 font-bold">Or continue with</span></div>
                </div>

                <button 
                    onClick={handleGitHubLogin}
                    className="w-full bg-white text-black hover:bg-gray-200 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                    <Github size={20} /> Sign in with GitHub
                </button>

                <p className="mt-8 text-center text-gray-500 text-sm">
                    Don't have an account? <Link to="/register" className="text-blue-500 hover:underline">Register now</Link>
                </p>
            </div>
        </div>
    );
}
