import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import API from "../api/client.js";
import VideoCard from "../components/VideoCard.jsx";
import { Loader2, Film, Flame } from "lucide-react";

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

            {/* Content Title */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "16px 0 24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    {selectedCategory === "Trending" ? (
                        <Flame size={20} color="var(--accent-primary)" />
                    ) : (
                        <Film size={20} color="var(--accent-primary)" />
                    )}
                    <h1 style={{ fontSize: "1.3rem", fontWeight: 700 }}>
                        {query
                            ? `Search results for "${query}"`
                            : selectedCategory === "Trending"
                            ? "Trending Videos"
                            : selectedCategory === "All Videos"
                            ? "All Videos"
                            : `${selectedCategory}`}
                    </h1>
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                    {videos.length} {videos.length === 1 ? "VIDEO" : "VIDEOS"}
                </div>
            </div>

            {/* Video Grid or Empty State */}
            {loading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
                    <Loader2 size={32} color="var(--accent-primary)" className="animate-spin" />
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
                        <span>NO VIDEOS FOUND</span>
                    </div>
                    <h3 style={{ fontSize: "1.15rem", fontWeight: 600 }}>No videos found</h3>
                    <p style={{ color: "var(--text-secondary)", maxWidth: "460px", fontSize: "0.9rem", lineHeight: 1.6 }}>
                        {query
                            ? `No videos found matching "${query}". Try searching with a different keyword or creator.`
                            : selectedCategory === "Trending"
                            ? "No trending videos yet. Start exploring and watching videos to populate this section."
                            : "No videos have been uploaded yet. Click Upload Video above to share your first video."}
                    </p>
                </div>
            )}
        </div>
    );
};

export default HomePage;
