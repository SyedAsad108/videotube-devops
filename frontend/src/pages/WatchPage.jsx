import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import API from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import VideoCard from "../components/VideoCard.jsx";
import { ThumbsUp, Bell, MessageSquare, Send, Loader2, Share2, Check } from "lucide-react";

const WatchPage = () => {
    const { videoId } = useParams();
    const { user } = useAuth();

    const [video, setVideo] = useState(null);
    const [relatedVideos, setRelatedVideos] = useState([]);
    const [comments, setComments] = useState([]);
    const [commentText, setCommentText] = useState("");
    const [loading, setLoading] = useState(true);
    const [commentSubmitting, setCommentSubmitting] = useState(false);
    const [copied, setCopied] = useState(false);

    const fetchVideoDetails = async () => {
        try {
            setLoading(true);
            const res = await API.get(`/videos/${videoId}`);
            setVideo(res.data?.data);

            // Fetch comments
            const commentsRes = await API.get(`/comments/${videoId}`);
            setComments(commentsRes.data?.data?.docs || []);

            // Fetch related videos
            const relatedRes = await API.get("/videos", { params: { limit: 8 } });
            setRelatedVideos(
                (relatedRes.data?.data?.docs || []).filter((v) => v._id !== videoId)
            );
        } catch (error) {
            console.error("Failed to load video details:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVideoDetails();
        window.scrollTo(0, 0);
    }, [videoId]);

    const handleToggleLike = async () => {
        if (!user) {
            alert("Please sign in to like this video.");
            return;
        }

        try {
            const res = await API.post(`/likes/toggle/v/${videoId}`);
            const isLiked = res.data?.data?.isLiked;
            setVideo((prev) => ({
                ...prev,
                isLiked,
                likesCount: isLiked ? (prev.likesCount || 0) + 1 : Math.max(0, (prev.likesCount || 1) - 1)
            }));
        } catch (error) {
            console.error("Failed to toggle like:", error);
        }
    };

    const handleToggleSubscribe = async () => {
        if (!user) {
            alert("Please sign in to subscribe.");
            return;
        }

        if (video.owner?._id === user._id) {
            alert("You cannot subscribe to your own channel.");
            return;
        }

        try {
            const res = await API.post(`/subscriptions/c/${video.owner._id}`);
            const isSubscribed = res.data?.data?.isSubscribed;
            setVideo((prev) => ({
                ...prev,
                owner: {
                    ...prev.owner,
                    isSubscribed,
                    subscribersCount: isSubscribed
                        ? (prev.owner?.subscribersCount || 0) + 1
                        : Math.max(0, (prev.owner?.subscribersCount || 1) - 1)
                }
            }));
        } catch (error) {
            console.error("Failed to toggle subscription:", error);
        }
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!user) {
            alert("Please sign in to leave a comment.");
            return;
        }

        if (!commentText.trim()) return;

        try {
            setCommentSubmitting(true);
            const res = await API.post(`/comments/${videoId}`, { content: commentText.trim() });
            const newComment = res.data?.data;
            setComments((prev) => [newComment, ...prev]);
            setCommentText("");
        } catch (error) {
            console.error("Failed to post comment:", error);
        } finally {
            setCommentSubmitting(false);
        }
    };

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", padding: "100px 0" }}>
                <Loader2 size={40} color="var(--accent-primary)" className="animate-spin" />
            </div>
        );
    }

    if (!video) {
        return (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
                <h2>Video not found</h2>
                <Link to="/" className="btn btn-primary" style={{ marginTop: "16px" }}>
                    Back to Home
                </Link>
            </div>
        );
    }

    return (
        <div className="watch-container">
            {/* Primary Video Player & Interaction Column */}
            <div>
                <div className="player-card">
                    <video
                        src={video.playbackUrl || video.videoFile}
                        poster={video.thumbnail}
                        controls
                        autoPlay
                        playsInline
                    />
                </div>

                <div className="watch-info">
                    <h1 style={{ fontSize: "1.35rem", lineHeight: 1.4 }}>{video.title}</h1>

                    <div className="watch-header">
                        {/* Channel Details & Subscribe Button */}
                        <div className="channel-subscribe-box">
                            <Link to={`/c/${video.owner?.username}`}>
                                <img
                                    src={video.owner?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80"}
                                    alt={video.owner?.fullName}
                                    className="channel-avatar"
                                    style={{ width: "44px", height: "44px" }}
                                />
                            </Link>
                            <div>
                                <Link to={`/c/${video.owner?.username}`} style={{ fontWeight: 600 }}>
                                    {video.owner?.fullName || video.owner?.username}
                                </Link>
                                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                                    {video.owner?.subscribersCount || 0} subscribers
                                </div>
                            </div>

                            {user?._id !== video.owner?._id && (
                                <button
                                    className={`btn ${video.owner?.isSubscribed ? "btn-secondary" : "btn-primary"}`}
                                    onClick={handleToggleSubscribe}
                                    style={{ marginLeft: "12px" }}
                                >
                                    <Bell size={15} />
                                    <span>{video.owner?.isSubscribed ? "Subscribed" : "Subscribe"}</span>
                                </button>
                            )}
                        </div>

                        {/* Action Buttons: Like, Share */}
                        <div className="watch-actions">
                            <button
                                className={`action-chip ${video.isLiked ? "liked" : ""}`}
                                onClick={handleToggleLike}
                            >
                                <ThumbsUp size={16} fill={video.isLiked ? "currentColor" : "none"} />
                                <span>{video.likesCount || 0}</span>
                            </button>

                            <button className="action-chip" onClick={handleShare}>
                                {copied ? <Check size={16} color="var(--success)" /> : <Share2 size={16} />}
                                <span>{copied ? "Copied Link" : "Share"}</span>
                            </button>
                        </div>
                    </div>

                    {/* Expandable Description */}
                    <div className="description-box">
                        <div style={{ fontWeight: 600, marginBottom: "6px" }}>
                            {video.views || 0} views • Published {new Date(video.createdAt).toLocaleDateString()}
                        </div>
                        <p style={{ whiteSpace: "pre-wrap", color: "var(--text-secondary)" }}>
                            {video.description}
                        </p>
                    </div>

                    {/* Comments Section */}
                    <div className="comments-section">
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <MessageSquare size={20} color="var(--accent-primary)" />
                            <h3>{comments.length} Comments</h3>
                        </div>

                        {user ? (
                            <form className="comment-input-box" onSubmit={handleAddComment}>
                                <img
                                    src={user.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80"}
                                    alt={user.fullName}
                                    className="channel-avatar"
                                    style={{ width: "40px", height: "40px" }}
                                />
                                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
                                    <textarea
                                        placeholder="Add a comment..."
                                        value={commentText}
                                        onChange={(e) => setCommentText(e.target.value)}
                                    />
                                    <div style={{ alignSelf: "flex-end" }}>
                                        <button
                                            type="submit"
                                            className="btn btn-primary"
                                            disabled={commentSubmitting || !commentText.trim()}
                                        >
                                            <Send size={14} />
                                            <span>Comment</span>
                                        </button>
                                    </div>
                                </div>
                            </form>
                        ) : (
                            <div style={{ background: "var(--bg-secondary)", padding: "14px", borderRadius: "var(--radius-md)" }}>
                                <Link to="/auth" style={{ color: "var(--accent-primary)", fontWeight: 600 }}>
                                    Sign in
                                </Link>{" "}
                                to join the conversation.
                            </div>
                        )}

                        {/* Comments List */}
                        <div>
                            {comments.map((comment) => (
                                <div key={comment._id} className="comment-item">
                                    <img
                                        src={comment.owner?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80"}
                                        alt={comment.owner?.fullName || "User"}
                                        className="channel-avatar"
                                        style={{ width: "36px", height: "36px" }}
                                    />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                            <span className="comment-author">
                                                {comment.owner?.fullName || comment.owner?.username}
                                            </span>
                                            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                                                {new Date(comment.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className="comment-text">{comment.content}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Related Videos Column */}
            <div>
                <h3 style={{ fontSize: "1.1rem", marginBottom: "16px" }}>Up Next</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {relatedVideos.map((item) => (
                        <VideoCard key={item._id} video={item} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default WatchPage;
