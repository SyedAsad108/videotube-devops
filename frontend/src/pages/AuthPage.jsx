import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { LogIn, UserPlus, Loader2 } from "lucide-react";

const AuthPage = () => {
    const [tab, setTab] = useState("login"); // "login" or "register"
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const { login, register } = useAuth();

    // Login Form State
    const [loginIdentifier, setLoginIdentifier] = useState("");
    const [loginPassword, setLoginPassword] = useState("");

    // Register Form State
    const [fullName, setFullName] = useState("");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            await login(loginIdentifier, loginPassword);
            navigate("/");
        } catch (err) {
            setError(err.response?.data?.message || "Invalid credentials. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        setError("");

        setLoading(true);
        try {
            await register({
                fullName: fullName.trim(),
                username: username.trim(),
                email: email.trim(),
                password
            });
            // Automatically log in after registration
            await login(username.trim(), password);
            navigate("/");
        } catch (err) {
            setError(err.response?.data?.message || "Registration failed. Please check your details.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-wrapper">
            <div className="auth-aura" />
            <div className="auth-card">
                <div style={{ textAlign: "center", marginBottom: "28px" }}>
                    <h2 style={{ fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.03em" }}>
                        Video<span style={{ color: "var(--accent-primary)" }}>Tube</span>
                    </h2>
                    <p style={{ fontSize: "0.86rem", color: "var(--text-muted)", marginTop: "4px" }}>
                        {tab === "login" ? "Welcome back! Enter your credentials to continue." : "Join our community of video creators and engineers."}
                    </p>
                </div>

                <div className="auth-tabs">
                    <div
                        className={`auth-tab ${tab === "login" ? "active" : ""}`}
                        onClick={() => { setTab("login"); setError(""); }}
                    >
                        Sign In
                    </div>
                    <div
                        className={`auth-tab ${tab === "register" ? "active" : ""}`}
                        onClick={() => { setTab("register"); setError(""); }}
                    >
                        Create Account
                    </div>
                </div>

                {error && <div className="alert-box">{error}</div>}

                {tab === "login" ? (
                    <form onSubmit={handleLoginSubmit}>
                        <div className="form-group">
                            <label>Username or Email</label>
                            <input
                                type="text"
                                placeholder="Enter username or email"
                                value={loginIdentifier}
                                onChange={(e) => setLoginIdentifier(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Password</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={loginPassword}
                                onChange={(e) => setLoginPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{ width: "100%", marginTop: "16px", padding: "12px" }}
                            disabled={loading}
                        >
                            {loading ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                <>
                                    <LogIn size={18} />
                                    <span>Sign In</span>
                                </>
                            )}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleRegisterSubmit}>
                        <div className="form-group">
                            <label>Full Name *</label>
                            <input
                                type="text"
                                placeholder="e.g. Asad S."
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Username *</label>
                            <input
                                type="text"
                                placeholder="e.g. asadsjc"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Email *</label>
                            <input
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Password *</label>
                            <input
                                type="password"
                                placeholder="Min 6 characters"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{ width: "100%", marginTop: "16px", padding: "12px" }}
                            disabled={loading}
                        >
                            {loading ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                <>
                                    <UserPlus size={18} />
                                    <span>Register & Join</span>
                                </>
                            )}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default AuthPage;
