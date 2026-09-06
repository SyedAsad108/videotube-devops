import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { Search, Upload, LogIn, LogOut, PlaySquare } from "lucide-react";

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
            <Link to="/" className="nav-brand">
                <div className="nav-brand-logo">
                    <PlaySquare size={18} strokeWidth={2.2} />
                </div>
                <span>VideoTube</span>
            </Link>

            <form className="nav-search" onSubmit={handleSearch}>
                <Search size={16} color="var(--text-muted)" />
                <input
                    type="text"
                    placeholder="Search videos, creators, topics..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </form>

            <div className="nav-actions">
                {user ? (
                    <>
                        <button className="btn btn-primary" onClick={onOpenUpload}>
                            <Upload size={15} strokeWidth={2.2} />
                            <span>Upload Video</span>
                        </button>

                        <Link to={`/c/${user.username}`} className="channel-subscribe-box">
                            <img
                                src={user.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80"}
                                alt={user.fullName}
                                className="channel-avatar"
                                style={{ width: "34px", height: "34px" }}
                            />
                        </Link>

                        <button className="btn btn-secondary" onClick={logout} title="Log out" style={{ padding: "8px 10px" }}>
                            <LogOut size={15} />
                        </button>
                    </>
                ) : (
                    <Link to="/auth" className="btn btn-primary">
                        <LogIn size={15} />
                        <span>Sign In</span>
                    </Link>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
