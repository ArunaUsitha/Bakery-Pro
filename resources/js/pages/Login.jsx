import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, User, Loader2, AlertCircle } from 'lucide-react';

const Login = () => {
    const [loginInput, setLoginInput] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from?.pathname || "/";

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        const result = await login({ login: loginInput, password });

        if (result.success) {
            navigate(from, { replace: true });
        } else {
            setError(result.message);
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] p-4">
            <div className="w-full max-w-md">
                <div className="bg-[var(--card-bg)] rounded-3xl shadow-2xl border border-[var(--border-color)] overflow-hidden">
                    <div className="p-8 text-center bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
                        <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                            <Lock size={40} className="text-white" />
                        </div>
                        <h1 className="text-3xl font-bold mb-1">Bakery Pro</h1>
                        <p className="text-blue-100 opacity-80">Management System</p>
                    </div>

                    <div className="p-8">
                        <h2 className="text-xl font-semibold mb-6 text-[var(--text-primary)]">Welcome Back</h2>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {error && (
                                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3 text-red-700 dark:text-red-400 text-sm">
                                    <AlertCircle size={18} />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2 px-1">
                                    Username or Email
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[var(--text-muted)]">
                                        <User size={18} />
                                    </div>
                                    <input
                                        type="text"
                                        value={loginInput}
                                        onChange={(e) => setLoginInput(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-[var(--text-primary)]"
                                        placeholder="admin"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2 px-1">
                                    Password
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[var(--text-muted)]">
                                        <Lock size={18} />
                                    </div>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-[var(--text-primary)]"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform transition-all active:scale-[0.98] flex items-center justify-center gap-2 group"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="animate-spin" size={20} />
                                ) : (
                                    <>
                                        Sign In
                                        <span className="group-hover:translate-x-1 transition-transform">→</span>
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-8 pt-6 border-t border-[var(--border-color)] text-center text-sm text-[var(--text-muted)]">
                            <p>Default credentials: <strong>admin</strong> / <strong>admin</strong></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
