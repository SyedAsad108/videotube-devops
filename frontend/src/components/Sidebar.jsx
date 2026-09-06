import React from "react";
import { NavLink, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { Film, Flame, Tv, History, ThumbsUp, User } from "lucide-react";

const Sidebar = () => {
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const currentCategory = searchParams.get("category");

    return (
        <aside className="sidebar">
            <NavLink
                to="/"
                className={({ isActive }) =>
                    `sidebar-item ${isActive && !currentCategory ? "active" : ""}`
                }
                end
            >
                <Film size={17} />
                <span>All Videos</span>
            </NavLink>

            <NavLink
                to="/?category=Trending"
                className={`sidebar-item ${currentCategory === "Trending" ? "active" : ""}`}
            >
                <Flame size={17} />
                <span>Trending</span>
            </NavLink>

            <NavLink
                to="/subscriptions"
                className={({ isActive }) => `sidebar-item ${isActive ? "active" : ""}`}
            >
                <Tv size={17} />
                <span>Subscriptions</span>
            </NavLink>

            <NavLink
                to="/history"
                className={({ isActive }) => `sidebar-item ${isActive ? "active" : ""}`}
            >
                <History size={17} />
                <span>Watch History</span>
            </NavLink>

            <NavLink
                to="/liked-videos"
                className={({ isActive }) => `sidebar-item ${isActive ? "active" : ""}`}
            >
                <ThumbsUp size={17} />
                <span>Liked Videos</span>
            </NavLink>

            {user && (
                <NavLink
                    to={`/c/${user.username}`}
                    className={({ isActive }) => `sidebar-item ${isActive ? "active" : ""}`}
                >
                    <User size={17} />
                    <span>My Channel</span>
                </NavLink>
            )}
        </aside>
    );
};

export default Sidebar;
