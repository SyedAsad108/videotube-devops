import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import API from "../api/client.js";
import VideoCard from "../components/VideoCard.jsx";
import { Film, Flame, Sparkles } from "lucide-react";

const CATEGORIES = [
    "All Videos",
    "Trending",
    "Technology",
    "Gaming",
    "Music",
    "Podcasts",
    "Tutorials",
    "News"
];

const HomePage = () => {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const query = searchParams.get("query") || "";
    const categoryParam = searchParams.get("category") || "All Videos";
    const [selectedCategory, setSelectedCategory] = useState(categoryParam);

    useEffect(() => {
        setSelectedCategory(categoryParam);
    }, [categoryParam]);

    const fetchVideos = async () => {
        try {
            setLoading(true);
            const params = { page: 1, limit: 24 };

            if (query) {
                params.query = query;
            } else if (selectedCategory === "Trending") {
                params.sortBy = "views";
                params.sortType = "desc";
            } else if (selectedCategory !== "All Videos") {
                params.query = selectedCategory;
            }

            const res = await API.get("/videos", { params });
            setVideos(res.data?.data?.docs || []);
        } catch (error) {
            console.error("Failed to fetch videos:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVideos();
    }, [query, selectedCategory]);

    const handleCategoryClick = (cat) => {
        setSelectedCategory(cat);
        if (cat === "All Videos") {
            navigate("/");
        } else if (cat === "Trending") {
            navigate("/?category=Trending");
        } else {
            navigate(`/?category=${encodeURIComponent(cat)}`);
        }
    };

    return (
        <div>
            {/* Category Filter Pills */}
            <div className="category-bar">
                {CATEGORIES.map((cat) => (
                    <button
                        key={cat}
                        className={`pill ${selectedCategory === cat ? "active" : ""}`}
                        onClick={() => handleCategoryClick(cat)}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Content Title Header */}
            <div className="feed-header">
                <div className="feed-title-wrap">
                    {selectedCategory === "Trending" ? (
                        <Flame size={24} color="var(--accent-primary)" />
                    ) : query ? (
                        <Sparkles size={24} color="var(--accent-primary)" />
                    ) : (
                        <Film size={24} color="var(--accent-primary)" />
                    )}
                    <h1>
                        {query
                            ? `Results for "${query}"`
                            : selectedCategory === "Trending"
                            ? "Trending Now"
                            : selectedCategory === "All Videos"
                            ? "Explore Videos"
                            : selectedCategory}
                    </h1>
                </div>
                {!loading && (
                    <div className="feed-badge">
                        <span className="feed-badge-dot" />
                        <span>{videos.length} {videos.length === 1 ? "VIDEO" : "VIDEOS"}</span>
                    </div>
                )}
            </div>

            {/* Video Grid, Skeleton Shimmer, or Empty State */}
            {loading ? (
                <div className="video-grid">
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                        <div key={n} className="skeleton-card">
                            <div className="skeleton-thumb skeleton-shimmer" />
                            <div style={{ padding: "16px", display: "flex", gap: "14px" }}>
                                <div className="skeleton-avatar skeleton-shimmer" />
                                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
                                    <div className="skeleton-line skeleton-shimmer" style={{ width: "85%" }} />
                                    <div className="skeleton-line skeleton-shimmer" style={{ width: "50%", height: "12px" }} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : videos.length > 0 ? (
                <div className="video-grid">
                    {videos.map((video) => (
                        <VideoCard key={video._id} video={video} />
                    ))}
                </div>
            ) : (
                <div className="empty-state-box">
                    <div className="empty-state-badge">
                        <Film size={14} />
                        <span>DISCOVER MORE</span>
                    </div>
                    <h3 style={{ fontSize: "1.2rem", fontWeight: 600 }}>No videos available</h3>
                    <p style={{ color: "var(--text-secondary)", maxWidth: "460px", fontSize: "0.92rem", lineHeight: 1.6 }}>
                        {query
                            ? `No videos found matching "${query}". Try searching with different keywords or creators.`
                            : selectedCategory === "Trending"
                            ? "No trending videos yet. Watch and interact with videos to populate this feed."
                            : "Be the first to publish! Click the Upload button above to share your content with the world."}
                    </p>
                </div>
            )}
        </div>
    );
};

export default HomePage;
