import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import API from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import VideoCard from "../components/VideoCard.jsx";
import { ThumbsUp, Loader2, Film } from "lucide-react";

const LikedVideosPage = () => {
    const { user } = useAuth();
    const [likedVideos, setLikedVideos] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchLikedVideos = async () => {
        try {
            setLoading(true);
            const res = await API.get("/likes/videos");
            const items = res.data?.data || [];
            // Each item contains { _id, video, createdAt }
            setLikedVideos(items.map((item) => item.video).filter(Boolean));
        } catch (error) {
            console.error("Failed to load liked videos:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchLikedVideos();
        } else {
            setLoading(false);
        }
    }, [user]);

    if (!user) {
        return (
            <div className="empty-state-box" style={{ marginTop: "40px" }}>
                <div className="empty-state-badge">
                    <ThumbsUp size={14} />
                    <span>COLLECTION</span>
                </div>
                <h2>Save your favorite videos</h2>
                <p style={{ color: "var(--text-secondary)", maxWidth: "460px", fontSize: "0.94rem" }}>
                    Sign in to see the videos you've liked, build your collection, and support creators.
                </p>
                <Link to="/auth" className="btn btn-primary" style={{ marginTop: "8px" }}>Sign In</Link>
            </div>
        );
    }

    return (
        <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "28px" }}>
                <ThumbsUp size={24} color="var(--accent-primary)" />
                <h1 style={{ fontSize: "1.4rem" }}>Liked Videos</h1>
            </div>

            {loading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
                    <Loader2 size={36} color="var(--accent-primary)" className="animate-spin" />
                </div>
            ) : likedVideos.length > 0 ? (
                <div className="video-grid">
                    {likedVideos.map((video) => (
                        <VideoCard key={video._id} video={video} />
                    ))}
                </div>
            ) : (
                <div className="empty-state-box">
                    <div className="empty-state-badge">
                        <Film size={14} />
                        <span>NO LIKES YET</span>
                    </div>
                    <h3>No liked videos yet</h3>
                    <p style={{ color: "var(--text-secondary)", maxWidth: "460px", fontSize: "0.92rem" }}>
                        Videos you give a thumbs up to will appear here for easy access.
                    </p>
                </div>
            )}
        </div>
    );
};

export default LikedVideosPage;
