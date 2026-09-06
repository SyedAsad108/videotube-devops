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
    const [avatar, setAvatar] = useState(null);
    const [coverImage, setCoverImage] = useState(null);

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

        if (!avatar) {
            setError("Avatar image is required.");
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append("fullName", fullName.trim());
            formData.append("username", username.trim());
            formData.append("email", email.trim());
            formData.append("password", password);
            formData.append("avatar", avatar);
            if (coverImage) {
                formData.append("coverImage", coverImage);
            }

            await register(formData);
            // Automatically log in after registration
            await login(username, password);
            navigate("/");
        } catch (err) {
            setError(err.response?.data?.message || "Registration failed. Please check your details.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-wrapper">
            <div className="auth-card">
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

                        <div className="form-group">
                            <label>Avatar Photo *</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setAvatar(e.target.files[0])}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Cover Banner (Optional)</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setCoverImage(e.target.files[0])}
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
