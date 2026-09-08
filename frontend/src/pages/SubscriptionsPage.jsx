import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import API from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { Compass, Users, Loader2, Bell } from "lucide-react";

const SubscriptionsPage = () => {
    const { user } = useAuth();
    const [channels, setChannels] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchSubscriptions = async () => {
        try {
            setLoading(true);
            const res = await API.get(`/subscriptions/u/${user._id}`);
            setChannels(res.data?.data?.subscribedChannels || []);
        } catch (error) {
            console.error("Failed to load subscriptions:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchSubscriptions();
        } else {
            setLoading(false);
        }
    }, [user]);

    const handleUnsubscribe = async (channelId) => {
        try {
            await API.post(`/subscriptions/c/${channelId}`);
            setChannels((prev) => prev.filter((item) => item.channel?._id !== channelId));
        } catch (error) {
            console.error("Failed to unsubscribe:", error);
        }
    };

    if (!user) {
        return (
            <div style={{ textAlign: "center", padding: "80px 20px" }}>
                <Compass size={48} color="var(--accent-primary)" style={{ marginBottom: "16px" }} />
                <h2>Don't miss new videos</h2>
                <p style={{ color: "var(--text-secondary)", margin: "8px 0 20px" }}>
                    Sign in to see updates from your favorite creators.
                </p>
                <Link to="/auth" className="btn btn-primary">Sign In</Link>
            </div>
        );
    }

    return (
        <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px" }}>
                <Compass size={24} color="var(--accent-primary)" />
                <h1>Subscribed Channels</h1>
            </div>

            {loading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
                    <Loader2 size={36} color="var(--accent-primary)" className="animate-spin" />
                </div>
            ) : channels.length > 0 ? (
                <div className="channel-card-grid">
                    {channels.map((item) => (
                        <div key={item._id} className="channel-card">
                            <Link to={`/c/${item.channel?.username}`}>
                                <img
                                    src={item.channel?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80"}
                                    alt={item.channel?.fullName}
                                    className="channel-avatar"
                                />
                            </Link>

                            <div>
                                <Link to={`/c/${item.channel?.username}`} style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.08rem" }}>
                                    {item.channel?.fullName || item.channel?.username}
                                </Link>
                                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "3px" }}>
                                    @{item.channel?.username}
                                </div>
                            </div>

                            <button
                                className="btn btn-secondary"
                                onClick={() => handleUnsubscribe(item.channel?._id)}
                                style={{ marginTop: "4px", fontSize: "0.82rem", padding: "8px 16px" }}
                            >
                                <Bell size={14} />
                                <span>Unsubscribe</span>
                            </button>
                        </div>
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
                    <Users size={40} color="var(--text-muted)" />
                    <h3>No subscriptions yet</h3>
                    <p style={{ color: "var(--text-secondary)" }}>
                        When you subscribe to channels, they will appear here.
                    </p>
                </div>
            )}
        </div>
    );
};

export default SubscriptionsPage;
