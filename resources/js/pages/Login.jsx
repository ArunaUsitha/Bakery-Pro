import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "../theme/tailadmin/icons";
import Label from "../theme/tailadmin/components/form/Label";
import Input from "../theme/tailadmin/components/form/input/InputField";
import Checkbox from "../theme/tailadmin/components/form/input/Checkbox";
import Button from "../theme/tailadmin/components/ui/button/Button";
import GridShape from "../theme/tailadmin/components/common/GridShape";
import ThemeTogglerTwo from "../theme/tailadmin/components/common/ThemeTogglerTwo";
import { Loader2, AlertCircle, Croissant } from "lucide-react";

export default function Login() {
    const [loginInput, setLoginInput] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isChecked, setIsChecked] = useState(false);
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from?.pathname || "/";

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
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
        <div className="relative p-6 bg-white z-1 dark:bg-gray-900 sm:p-0">
            <div className="relative flex flex-col justify-center w-full h-screen lg:flex-row dark:bg-gray-900 sm:p-0">
                <div className="flex flex-col flex-1">
                    <div className="w-full max-w-md pt-10 mx-auto">
                        <Link
                            to="/"
                            className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                        >
                            <ChevronLeftIcon className="size-5" />
                            Back to dashboard
                        </Link>
                    </div>
                    <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
                        <div>
                            <div className="mb-5 sm:mb-8">
                                <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
                                    Sign In
                                </h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Enter your email/username and password to sign in!
                                </p>
                            </div>

                            {error && (
                                <div className="p-4 mb-6 bg-error-50 dark:bg-error-500/10 border border-error-200 dark:border-error-800 rounded-xl flex items-center gap-3 text-error-600 dark:text-error-400 text-sm animate-shake">
                                    <AlertCircle size={18} />
                                    <span>{error}</span>
                                </div>
                            )}

                            <form onSubmit={handleSubmit}>
                                <div className="space-y-6">
                                    <div>
                                        <Label htmlFor="login">
                                            Email or Username <span className="text-error-500">*</span>
                                        </Label>
                                        <Input
                                            id="login"
                                            placeholder="mail@example.com or username"
                                            value={loginInput}
                                            onChange={(e) => setLoginInput(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="password">
                                            Password <span className="text-error-500">*</span>
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id="password"
                                                type={showPassword ? "text" : "password"}
                                                placeholder="Enter your password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                            />
                                            <span
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                                            >
                                                {showPassword ? (
                                                    <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                                                ) : (
                                                    <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Checkbox checked={isChecked} onChange={setIsChecked} label="Keep me logged in" />
                                        </div>
                                        <Link
                                            to="/forgot-password"
                                            className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                                        >
                                            Forgot password?
                                        </Link>
                                    </div>
                                    <div>
                                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                                            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : "Sign In"}
                                        </Button>
                                    </div>
                                </div>
                            </form>

                            <div className="mt-5">
                                <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                                    Not registered yet? {" "}
                                    <Link
                                        to="/contact-admin"
                                        className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                                    >
                                        Contact Admin
                                    </Link>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="items-center hidden w-full h-full lg:w-1/2 bg-brand-950 dark:bg-white/5 lg:grid relative overflow-hidden">
                    <div className="relative flex items-center justify-center z-1 h-full">
                        <GridShape />
                        <div className="flex flex-col items-center max-w-xs text-center px-4">
                            <div className="w-20 h-20 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl flex items-center justify-center mb-8 shadow-2xl">
                                <Croissant size={40} className="text-white" />
                            </div>
                            <h1 className="text-3xl font-bold text-white mb-4">Bakery Pro</h1>
                            <p className="text-gray-400 dark:text-white/60">
                                The ultimate management system for modern bakeries, production lines, and retail chains.
                            </p>
                        </div>
                    </div>
                </div>
                <div className="fixed z-50 hidden bottom-6 right-6 sm:block">
                    <ThemeTogglerTwo />
                </div>
            </div>
        </div>
    );
}
