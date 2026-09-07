import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { Search, Upload, LogIn, LogOut, Play } from "lucide-react";

const Navbar = ({ onOpenUpload }) => {
    const { user, logout } = useAuth();
    const [searchQuery, setSearchQuery] = useState("");
    const navigate = useNavigate();

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/?query=${encodeURIComponent(searchQuery.trim())}`);
        } else {
            navigate("/");
        }
    };

    return (
        <nav className="navbar">
            <Link to="/" className="nav-brand" title="VideoTube Home">
                <div className="nav-brand-logo">
                    <Play size={18} fill="currentColor" strokeWidth={0} />
                </div>
                <div className="nav-brand-title">
                    <span>Video</span>
                    <span className="nav-brand-accent">Tube</span>
                    <span className="nav-brand-dot" />
                </div>
            </Link>

            <form className="nav-search" onSubmit={handleSearch}>
                <Search size={16} color="var(--text-muted)" />
                <input
                    type="text"
                    placeholder="Search videos, topics, creators..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <span className="nav-search-shortcut">⌘K</span>
            </form>

            <div className="nav-actions">
                {user ? (
                    <>
                        <button className="btn btn-primary" onClick={onOpenUpload} title="Publish a new video">
                            <Upload size={16} strokeWidth={2.2} />
                            <span>Upload</span>
                        </button>

                        <Link to={`/c/${user.username}`} className="nav-avatar-link" title={`Channel: ${user.fullName || user.username}`}>
                            <img
                                src={user.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80"}
                                alt={user.fullName || "Avatar"}
                                className="channel-avatar"
                                style={{ width: "34px", height: "34px" }}
                            />
                        </Link>

                        <button className="btn btn-secondary btn-icon" onClick={logout} title="Sign Out">
                            <LogOut size={16} />
                        </button>
                    </>
                ) : (
                    <Link to="/auth" className="btn btn-primary">
                        <LogIn size={16} />
                        <span>Sign In</span>
                    </Link>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
