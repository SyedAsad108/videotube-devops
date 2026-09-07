import React from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { Compass, Flame, Tv, Clock, ThumbsUp, UserCircle } from "lucide-react";

const Sidebar = () => {
    const { user } = useAuth();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const currentCategory = searchParams.get("category");

    const isExploreActive = location.pathname === "/" && !currentCategory;
    const isTrendingActive = location.pathname === "/" && currentCategory === "Trending";

    return (
        <aside className="sidebar">
            <div className="sidebar-section-title">Discover</div>

            <Link
                to="/"
                className={`sidebar-item ${isExploreActive ? "active" : ""}`}
            >
                <Compass size={18} />
                <span>Explore All</span>
            </Link>

            <Link
                to="/?category=Trending"
                className={`sidebar-item ${isTrendingActive ? "active" : ""}`}
            >
                <Flame size={18} />
                <span>Trending</span>
            </Link>

            <Link
                to="/subscriptions"
                className={`sidebar-item ${location.pathname === "/subscriptions" ? "active" : ""}`}
            >
                <Tv size={18} />
                <span>Subscriptions</span>
            </Link>

            <div className="sidebar-section-title" style={{ marginTop: "12px" }}>Library</div>

            <Link
                to="/history"
                className={`sidebar-item ${location.pathname === "/history" ? "active" : ""}`}
            >
                <Clock size={18} />
                <span>Watch History</span>
            </Link>

            <Link
                to="/liked-videos"
                className={`sidebar-item ${location.pathname === "/liked-videos" ? "active" : ""}`}
            >
                <ThumbsUp size={18} />
                <span>Liked Videos</span>
            </Link>

            {user && (
                <Link
                    to={`/c/${user.username}`}
                    className={`sidebar-item ${location.pathname === `/c/${user.username}` ? "active" : ""}`}
                >
                    <UserCircle size={18} />
                    <span>My Studio</span>
                </Link>
            )}
        </aside>
    );
};

export default Sidebar;
