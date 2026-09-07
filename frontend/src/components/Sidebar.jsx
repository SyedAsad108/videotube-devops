import React from "react";
import { NavLink, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { Compass, Flame, Tv, Clock, ThumbsUp, UserCircle } from "lucide-react";

const Sidebar = () => {
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const currentCategory = searchParams.get("category");

    return (
        <aside className="sidebar">
            <div className="sidebar-section-title">Discover</div>

            <NavLink
                to="/"
                className={({ isActive }) =>
                    `sidebar-item ${isActive && !currentCategory ? "active" : ""}`
                }
                end
            >
                <Compass size={18} />
                <span>Explore All</span>
            </NavLink>

            <NavLink
                to="/?category=Trending"
                className={`sidebar-item ${currentCategory === "Trending" ? "active" : ""}`}
            >
                <Flame size={18} />
                <span>Trending</span>
            </NavLink>

            <NavLink
                to="/subscriptions"
                className={({ isActive }) => `sidebar-item ${isActive ? "active" : ""}`}
            >
                <Tv size={18} />
                <span>Subscriptions</span>
            </NavLink>

            <div className="sidebar-section-title" style={{ marginTop: "12px" }}>Library</div>

            <NavLink
                to="/history"
                className={({ isActive }) => `sidebar-item ${isActive ? "active" : ""}`}
            >
                <Clock size={18} />
                <span>Watch History</span>
            </NavLink>

            <NavLink
                to="/liked-videos"
                className={({ isActive }) => `sidebar-item ${isActive ? "active" : ""}`}
            >
                <ThumbsUp size={18} />
                <span>Liked Videos</span>
            </NavLink>

            {user && (
                <NavLink
                    to={`/c/${user.username}`}
                    className={({ isActive }) => `sidebar-item ${isActive ? "active" : ""}`}
                >
                    <UserCircle size={18} />
                    <span>My Studio</span>
                </NavLink>
            )}
        </aside>
    );
};

export default Sidebar;
