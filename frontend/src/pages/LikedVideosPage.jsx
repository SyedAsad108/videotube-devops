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
            <div style={{ textAlign: "center", padding: "80px 20px" }}>
                <ThumbsUp size={48} color="var(--accent-primary)" style={{ marginBottom: "16px" }} />
                <h2>Save your favorite videos</h2>
                <p style={{ color: "var(--text-secondary)", margin: "8px 0 20px" }}>
                    Sign in to see the videos you've liked.
                </p>
                <Link to="/auth" className="btn btn-primary">Sign In</Link>
            </div>
        );
    }

    return (
        <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px" }}>
                <ThumbsUp size={24} color="var(--accent-primary)" />
                <h1>Liked Videos</h1>
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
                <div
                    style={{
                        background: "var(--bg-secondary)",
                        border: "1px dashed var(--border-color)",
                        borderRadius: "var(--radius-lg)",
                        padding: "60px 24px",
                        textAlign: "center",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "12px"
                    }}
                >
                    <Film size={40} color="var(--text-muted)" />
                    <h3>No liked videos yet</h3>
                    <p style={{ color: "var(--text-secondary)" }}>
                        Videos you like will appear here for easy access.
                    </p>
                </div>
            )}
        </div>
    );
};

export default LikedVideosPage;
