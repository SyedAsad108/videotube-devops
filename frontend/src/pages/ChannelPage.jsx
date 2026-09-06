import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import API from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import VideoCard from "../components/VideoCard.jsx";
import { Bell, Loader2, Video as VideoIcon } from "lucide-react";

const ChannelPage = () => {
    const { username } = useParams();
    const { user } = useAuth();

    const [channel, setChannel] = useState(null);
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchChannelData = async () => {
        try {
            setLoading(true);
            const res = await API.get(`/users/c/${username}`);
            const channelData = res.data?.data;
            setChannel(channelData);

            if (channelData?._id) {
                const videosRes = await API.get("/videos", {
                    params: { userId: channelData._id, limit: 30 }
                });
                setVideos(videosRes.data?.data?.docs || []);
            }
        } catch (error) {
            console.error("Failed to load channel:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchChannelData();
    }, [username]);

    const handleToggleSubscribe = async () => {
        if (!user) {
            alert("Please sign in to subscribe.");
            return;
        }

        try {
            const res = await API.post(`/subscriptions/c/${channel._id}`);
            const isSubscribed = res.data?.data?.isSubscribed;
            setChannel((prev) => ({
                ...prev,
                isSubscribed,
                subscribersCount: isSubscribed
                    ? (prev.subscribersCount || 0) + 1
                    : Math.max(0, (prev.subscribersCount || 1) - 1)
            }));
        } catch (error) {
            console.error("Failed to toggle subscription:", error);
        }
    };

    if (loading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", padding: "100px 0" }}>
                <Loader2 size={40} color="var(--accent-primary)" className="animate-spin" />
            </div>
        );
    }

    if (!channel) {
        return (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
                <h2>Channel not found</h2>
            </div>
        );
    }

    return (
        <div>
            {/* Channel Banner Cover */}
            <div
                style={{
                    height: "180px",
                    width: "100%",
                    borderRadius: "var(--radius-lg)",
                    background: channel.coverImage
                        ? `url(${channel.coverImage}) center/cover no-repeat`
                        : "linear-gradient(180deg, #161616 0%, #080808 100%)",
                    border: "1px solid var(--border-color)",
                    marginBottom: "24px"
                }}
            />

            {/* Channel Info Header */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "16px",
                    paddingBottom: "24px",
                    borderBottom: "1px solid var(--border-color)",
                    marginBottom: "32px"
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                    <img
                        src={channel.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80"}
                        alt={channel.fullName}
                        style={{
                            width: "80px",
                            height: "80px",
                            borderRadius: "var(--radius-full)",
                            objectFit: "cover",
                            border: "3px solid var(--border-color)"
                        }}
                    />
                    <div>
                        <h1 style={{ fontSize: "1.6rem" }}>{channel.fullName}</h1>
                        <div style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
                            @{channel.username} • {channel.subscribersCount || 0} subscribers • {channel.channelsSubscribedToCount || 0} subscriptions
                        </div>
                    </div>
                </div>

                {user?._id !== channel._id && (
                    <button
                        className={`btn ${channel.isSubscribed ? "btn-secondary" : "btn-primary"}`}
                        onClick={handleToggleSubscribe}
                    >
                        <Bell size={16} />
                        <span>{channel.isSubscribed ? "Subscribed" : "Subscribe"}</span>
                    </button>
                )}
            </div>

            {/* Channel Videos Feed */}
            <h2 style={{ fontSize: "1.2rem", marginBottom: "20px" }}>Uploads</h2>

            {videos.length > 0 ? (
                <div className="video-grid">
                    {videos.map((video) => (
                        <VideoCard key={video._id} video={video} />
                    ))}
                </div>
            ) : (
                <div
                    style={{
                        background: "var(--bg-secondary)",
                        border: "1px dashed var(--border-color)",
                        borderRadius: "var(--radius-lg)",
                        padding: "48px 24px",
                        textAlign: "center",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "12px"
                    }}
                >
                    <VideoIcon size={36} color="var(--text-muted)" />
                    <p style={{ color: "var(--text-secondary)" }}>This channel has not uploaded any videos yet.</p>
                </div>
            )}
        </div>
    );
};

export default ChannelPage;
