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

    const [videoToDelete, setVideoToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const isOwner = Boolean(user && channel && (user._id === channel._id || user.username === channel.username));

    const handleDeleteVideo = (targetVideoId) => {
        setVideoToDelete(targetVideoId);
    };

    const confirmDeleteFromModal = async () => {
        if (!videoToDelete) return;
        try {
            setIsDeleting(true);
            await API.delete(`/videos/${videoToDelete}`);
            setVideos((prev) => prev.filter((v) => v._id !== videoToDelete));
            setVideoToDelete(null);
        } catch (err) {
            console.error("Failed to delete video:", err);
            alert(err.response?.data?.message || "Failed to delete video");
        } finally {
            setIsDeleting(false);
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
                        <VideoCard
                            key={video._id}
                            video={video}
                            isOwner={isOwner}
                            onDelete={handleDeleteVideo}
                        />
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

            {/* Video Deletion Confirmation Modal */}
            {videoToDelete && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: "rgba(0, 0, 0, 0.75)",
                        backdropFilter: "blur(4px)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 9999
                    }}
                    onClick={() => setVideoToDelete(null)}
                >
                    <div
                        style={{
                            background: "var(--bg-card, #18181b)",
                            border: "1px solid var(--border-color, #27272a)",
                            borderRadius: "var(--radius-lg, 12px)",
                            padding: "24px",
                            maxWidth: "400px",
                            width: "90%",
                            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)"
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 style={{ marginBottom: "10px", fontSize: "1.2rem" }}>Delete Video?</h3>
                        <p style={{ color: "var(--text-secondary, #a1a1aa)", fontSize: "0.95rem", marginBottom: "20px" }}>
                            Are you sure you want to permanently delete this video? This action will remove the video, comments, and media files from S3.
                        </p>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                            <button
                                className="btn btn-secondary"
                                onClick={() => setVideoToDelete(null)}
                                disabled={isDeleting}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={confirmDeleteFromModal}
                                disabled={isDeleting}
                                style={{ background: "#ef4444", borderColor: "#ef4444" }}
                            >
                                {isDeleting ? "Deleting..." : "Yes, Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChannelPage;
