import React from "react";
import { useNavigate } from "react-router-dom";
import { Trash2 } from "lucide-react";

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

const VideoCard = ({ video, isOwner = false, onDelete }) => {
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
            <div className="thumbnail-wrapper" style={{ position: "relative" }}>
                <img
                    src={video.thumbnail || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80"}
                    alt={video.title}
                    loading="lazy"
                />
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
                            top: "8px",
                            right: "8px",
                            background: "rgba(15, 15, 15, 0.85)",
                            border: "1px solid rgba(239, 68, 68, 0.5)",
                            color: "#ef4444",
                            width: "30px",
                            height: "30px",
                            borderRadius: "6px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            zIndex: 2
                        }}
                    >
                        <Trash2 size={15} />
                    </button>
                )}
            </div>

            <div className="video-info">
                <img
                    src={video.owner?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80"}
                    alt={video.owner?.fullName || "User"}
                    className="channel-avatar"
                    onClick={handleChannelClick}
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
};

export default VideoCard;
