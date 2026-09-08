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
                className="channel-banner"
                style={{
                    backgroundImage: channel.coverImage
                        ? `url(${channel.coverImage})`
                        : "radial-gradient(ellipse at top, #2a0815 0%, #06070a 100%)"
                }}
            />

            {/* Channel Profile Card */}
            <div className="channel-profile-bar">
                <div style={{ display: "flex", alignItems: "center", gap: "22px", flexWrap: "wrap" }}>
                    <img
                        src={channel.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80"}
                        alt={channel.fullName}
                        className="channel-profile-avatar"
                    />
                    <div>
                        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.03em" }}>{channel.fullName}</h1>
                        <div style={{ color: "var(--text-secondary)", fontSize: "0.92rem", marginTop: "4px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                            <span style={{ color: "var(--accent-primary)", fontWeight: 600 }}>@{channel.username}</span>
                            <span>•</span>
                            <span>{channel.subscribersCount || 0} subscribers</span>
                            <span>•</span>
                            <span>{channel.channelsSubscribedToCount || 0} subscriptions</span>
                        </div>
                    </div>
                </div>

                {user?._id !== channel._id && (
                    <button
                        className={`btn ${channel.isSubscribed ? "btn-secondary" : "btn-primary"}`}
                        onClick={handleToggleSubscribe}
                        style={{ padding: "10px 24px" }}
                    >
                        <Bell size={16} />
                        <span>{channel.isSubscribed ? "Subscribed" : "Subscribe"}</span>
                    </button>
                )}
            </div>

            {/* Channel Videos Feed */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "24px 0 20px" }}>
                <VideoIcon size={20} color="var(--accent-primary)" />
                <h2 style={{ fontSize: "1.3rem", fontWeight: 700 }}>Uploads</h2>
            </div>

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
                <div className="empty-state-box">
                    <div className="empty-state-badge">
                        <VideoIcon size={14} />
                        <span>NO UPLOADS</span>
                    </div>
                    <h3>This channel has not uploaded any videos yet</h3>
                    <p style={{ color: "var(--text-secondary)", maxWidth: "460px", fontSize: "0.92rem" }}>
                        Check back later or subscribe to get notified when new videos are published.
                    </p>
                </div>
            )}

            {/* Video Deletion Confirmation Modal */}
            {videoToDelete && (
                <div className="modal-overlay" onClick={() => setVideoToDelete(null)}>
                    <div className="modal-card" style={{ maxWidth: "440px" }} onClick={(e) => e.stopPropagation()}>
                        <h3 style={{ marginBottom: "12px", fontSize: "1.3rem", fontWeight: 700 }}>Delete Video?</h3>
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.92rem", lineHeight: 1.6, marginBottom: "24px" }}>
                            Are you sure you want to permanently delete this video? This action will remove the video, comments, and media files from S3 storage.
                        </p>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
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
                                style={{ background: "var(--danger)", borderColor: "var(--danger)" }}
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
