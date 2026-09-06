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
            <div style={{ textAlign: "center", padding: "80px 20px" }}>
                <History size={48} color="var(--accent-primary)" style={{ marginBottom: "16px" }} />
                <h2>Keep track of what you watch</h2>
                <p style={{ color: "var(--text-secondary)", margin: "8px 0 20px" }}>
                    Sign in to access your complete watch history.
                </p>
                <Link to="/auth" className="btn btn-primary">Sign In</Link>
            </div>
        );
    }

    return (
        <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px" }}>
                <History size={24} color="var(--accent-primary)" />
                <h1>Watch History</h1>
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
                    <h3>No watch history yet</h3>
                    <p style={{ color: "var(--text-secondary)" }}>
                        Videos you watch will appear here.
                    </p>
                </div>
            )}
        </div>
    );
};

export default HistoryPage;
