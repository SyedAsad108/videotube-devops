import React from "react";
import { useNavigate } from "react-router-dom";

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

const VideoCard = ({ video }) => {
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

    return (
        <div className="video-card" onClick={handleClick}>
            <div className="thumbnail-wrapper">
                <img
                    src={video.thumbnail || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80"}
                    alt={video.title}
                    loading="lazy"
                />
                {video.duration > 0 && (
                    <span className="video-duration">{formatDuration(video.duration)}</span>
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
