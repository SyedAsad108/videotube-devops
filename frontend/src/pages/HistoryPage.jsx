import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import API from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import VideoCard from "../components/VideoCard.jsx";
import { History, Loader2, Film } from "lucide-react";

const HistoryPage = () => {
    const { user } = useAuth();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const res = await API.get("/users/history");
            setHistory(res.data?.data || []);
        } catch (error) {
            console.error("Failed to load history:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchHistory();
        } else {
            setLoading(false);
        }
    }, [user]);

    if (!user) {
        return (
            <div className="empty-state-box" style={{ marginTop: "40px" }}>
                <div className="empty-state-badge">
                    <History size={14} />
                    <span>TIMELINE</span>
                </div>
                <h2>Keep track of what you watch</h2>
                <p style={{ color: "var(--text-secondary)", maxWidth: "460px", fontSize: "0.94rem" }}>
                    Sign in to access your complete watch history, resume playback, and get personalized recommendations.
                </p>
                <Link to="/auth" className="btn btn-primary" style={{ marginTop: "8px" }}>Sign In</Link>
            </div>
        );
    }

    return (
        <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "28px" }}>
                <History size={24} color="var(--accent-primary)" />
                <h1 style={{ fontSize: "1.4rem" }}>Watch History</h1>
            </div>

            {loading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
                    <Loader2 size={36} color="var(--accent-primary)" className="animate-spin" />
                </div>
            ) : history.length > 0 ? (
                <div className="video-grid">
                    {history.map((video) => (
                        <VideoCard key={video._id} video={video} />
                    ))}
                </div>
            ) : (
                <div className="empty-state-box">
                    <div className="empty-state-badge">
                        <Film size={14} />
                        <span>NO HISTORY</span>
                    </div>
                    <h3>No watch history yet</h3>
                    <p style={{ color: "var(--text-secondary)", maxWidth: "460px", fontSize: "0.92rem" }}>
                        Videos you watch will appear here so you can easily find them again.
                    </p>
                </div>
            )}
        </div>
    );
};

export default HistoryPage;
