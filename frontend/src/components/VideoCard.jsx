import React, { memo } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, Play } from "lucide-react";

const formatDuration = (seconds) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
};

const formatTimeAgo = (dateString) => {
    if (!dateString) return "Recently";
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return "Just now";
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
};

const VideoCard = memo(({ video, isOwner = false, onDelete }) => {
    const navigate = useNavigate();

    const handleClick = () => {
        navigate(`/watch/${video._id}`);
    };

    const handleChannelClick = (e) => {
        e.stopPropagation();
        if (video.owner?.username) {
            navigate(`/c/${video.owner.username}`);
        }
    };

    const handleDeleteClick = (e) => {
        e.stopPropagation();
        if (onDelete) {
            onDelete(video._id);
        }
    };

    return (
        <div className="video-card" onClick={handleClick}>
            <div className="thumbnail-wrapper">
                <img
                    src={video.thumbnail || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80"}
                    alt={video.title}
                    loading="lazy"
                    decoding="async"
                />

                {/* Subtle Hover Play Overlay */}
                <div className="thumbnail-play-overlay">
                    <div className="thumbnail-play-badge">
                        <Play size={20} fill="#ffffff" strokeWidth={0} />
                    </div>
                </div>

                {video.duration > 0 && (
                    <span className="video-duration">{formatDuration(video.duration)}</span>
                )}

                {isOwner && onDelete && (
                    <button
                        className="video-delete-btn"
                        onClick={handleDeleteClick}
                        title="Delete video"
                        style={{
                            position: "absolute",
                            top: "10px",
                            right: "10px",
                            background: "rgba(12, 13, 18, 0.88)",
                            backdropFilter: "blur(8px)",
                            border: "1px solid rgba(239, 68, 68, 0.5)",
                            color: "#ff334b",
                            width: "32px",
                            height: "32px",
                            borderRadius: "8px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            zIndex: 3,
                            transition: "all 0.18s ease"
                        }}
                    >
                        <Trash2 size={15} />
                    </button>
                )}
            </div>

            <div className="video-info">
                <img
                    src={video.owner?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80"}
                    alt={video.owner?.fullName || "Channel"}
                    className="channel-avatar"
                    loading="lazy"
                    decoding="async"
                    onClick={handleChannelClick}
                    title={video.owner?.fullName || video.owner?.username}
                />
                <div className="video-details">
                    <h3 className="video-title" title={video.title}>{video.title}</h3>
                    <span className="video-channel" onClick={handleChannelClick}>
                        {video.owner?.fullName || video.owner?.username || "Creator"}
                    </span>
                    <span className="video-meta">
                        {video.views || 0} views • {formatTimeAgo(video.createdAt)}
                    </span>
                </div>
            </div>
        </div>
    );
});

VideoCard.displayName = "VideoCard";

export default VideoCard;
