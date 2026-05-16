import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Terminal } from 'lucide-react';

function GithubIcon({ size }: { size?: number }) {
    return (
        <svg width={size || 20} height={size || 20} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
        </svg>
    );
}

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const auth = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (!auth) return;
        const params = new URLSearchParams(location.search);
        const token = params.get('token');
        if (token) {
            auth.setAuth(token, {} as import('../types').User);
            navigate('/dashboard');
        }
    }, [location, auth, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!auth) return;
        try {
            await auth.login(username, password);
            navigate('/dashboard');
        } catch {
            setError('Invalid credentials');
        }
    };

    const handleGitHubLogin = () => {
        const backendUrl = import.meta.env.VITE_API_URL || '';
        window.location.href = `${backendUrl}/api/auth/github`;
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 text-white font-sans">
            <div className="w-full max-w-md bg-[#111] border border-gray-800 rounded-2xl p-8 shadow-2xl">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-4">
                        <Terminal size={28} />
                    </div>
                    <h1 className="text-2xl font-bold">Welcome Back</h1>
                    <p className="text-gray-500 text-sm mt-2 text-center">Enter your credentials to access your V-PLATFORM workspace</p>
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
                    <GithubIcon size={20} /> Sign in with GitHub
                </button>

                <p className="mt-8 text-center text-gray-500 text-sm">
                    Don't have an account? <Link to="/register" className="text-blue-500 hover:underline">Register now</Link>
                </p>
            </div>
        </div>
    );
}
