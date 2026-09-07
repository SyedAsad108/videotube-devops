import React, { useState, useRef } from "react";
import API from "../api/client.js";
import { X, UploadCloud, Loader2, FileVideo, Image, CheckCircle2 } from "lucide-react";

const UploadModal = ({ isOpen, onClose, onUploadSuccess }) => {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [videoFile, setVideoFile] = useState(null);
    const [thumbnail, setThumbnail] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");
    const fileInputRef = useRef(null);
    const thumbInputRef = useRef(null);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!title.trim() || !description.trim()) {
            setError("Title and description are required.");
            return;
        }

        if (!videoFile) {
            setError("Please select a video file.");
            return;
        }

        // Validate video file extension and format
        const validVideoExtensions = [".mp4", ".mov", ".webm", ".mkv"];
        const fileName = (videoFile.name || "").toLowerCase();
        const fileExt = fileName.substring(fileName.lastIndexOf("."));
        const mimeType = (videoFile.type || "").toLowerCase();

        const isAllowedExtension = validVideoExtensions.includes(fileExt);
        const isVideoMime = mimeType.startsWith("video/") || mimeType === "application/x-quicktime";

        if (!isAllowedExtension && !isVideoMime) {
            setError("Unsupported file format. Please upload a valid video file (.mp4, .mov, .webm, .mkv).");
            return;
        }

        // Max 100 MB client-side check
        if (videoFile.size > 100 * 1024 * 1024) {
            setError("Video file exceeds the 100 MB maximum size limit.");
            return;
        }

        try {
            setUploading(true);
            const formData = new FormData();
            formData.append("title", title.trim());
            formData.append("description", description.trim());
            formData.append("videoFile", videoFile);
            if (thumbnail) {
                formData.append("thumbnail", thumbnail);
            }

            const res = await API.post("/videos", formData, {
                headers: {
                    "Content-Type": "multipart/form-data"
                }
            });

            if (onUploadSuccess) {
                onUploadSuccess(res.data?.data);
            }
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to upload video.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div>
                        <h2 style={{ fontSize: "1.35rem", fontWeight: 700 }}>Studio Video Upload</h2>
                        <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "2px" }}>
                            Upload high-definition media to your channel
                        </p>
                    </div>
                    <button className="btn btn-secondary btn-icon" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                {error && <div className="alert-box">{error}</div>}

                <form onSubmit={handleSubmit}>
                    {/* Interactive Dropzone */}
                    <div className="form-group">
                        <label>Video File (.mp4, .mov, .webm, .mkv) *</label>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="video/*,video/mp4,video/quicktime,video/mov,video/x-quicktime,video/webm,video/x-matroska,.mp4,.webm,.mkv,.mov,.MOV"
                            onChange={(e) => setVideoFile(e.target.files[0] || null)}
                            disabled={uploading}
                            style={{ display: "none" }}
                        />

                        <div
                            className="dropzone-box"
                            onClick={() => !uploading && fileInputRef.current?.click()}
                        >
                            {videoFile ? (
                                <>
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--accent-primary)" }}>
                                        <CheckCircle2 size={28} />
                                        <FileVideo size={28} />
                                    </div>
                                    <div style={{ fontWeight: 600, fontSize: "0.95rem", color: "var(--text-primary)" }}>
                                        {videoFile.name}
                                    </div>
                                    <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                                        {(videoFile.size / (1024 * 1024)).toFixed(2)} MB • Click to change file
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div style={{
                                        width: "48px",
                                        height: "48px",
                                        borderRadius: "50%",
                                        background: "rgba(255, 42, 85, 0.12)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: "var(--accent-primary)"
                                    }}>
                                        <UploadCloud size={24} />
                                    </div>
                                    <div style={{ fontWeight: 600, fontSize: "0.95rem", color: "var(--text-primary)" }}>
                                        Click to browse or drop your video here
                                    </div>
                                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", justifyContent: "center" }}>
                                        <span className="empty-state-badge" style={{ padding: "2px 8px", fontSize: "0.72rem" }}>MP4</span>
                                        <span className="empty-state-badge" style={{ padding: "2px 8px", fontSize: "0.72rem" }}>MOV</span>
                                        <span className="empty-state-badge" style={{ padding: "2px 8px", fontSize: "0.72rem" }}>WEBM</span>
                                        <span className="empty-state-badge" style={{ padding: "2px 8px", fontSize: "0.72rem" }}>MKV</span>
                                        <span style={{ fontSize: "0.74rem", color: "var(--text-muted)", alignSelf: "center", marginLeft: "4px" }}>Max 100 MB</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Title *</label>
                        <input
                            type="text"
                            placeholder="e.g. Building Cloud-Native Systems with AWS"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            disabled={uploading}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Description *</label>
                        <textarea
                            placeholder="What is this video about?"
                            rows={3}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            disabled={uploading}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Custom Thumbnail (Optional)</label>
                        <input
                            ref={thumbInputRef}
                            type="file"
                            accept="image/*"
                            onChange={(e) => setThumbnail(e.target.files[0] || null)}
                            disabled={uploading}
                            style={{ display: "none" }}
                        />
                        <div
                            onClick={() => !uploading && thumbInputRef.current?.click()}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                                padding: "10px 16px",
                                background: "rgba(255, 255, 255, 0.03)",
                                border: "1px solid var(--border-color)",
                                borderRadius: "var(--radius-md)",
                                cursor: "pointer",
                                transition: "var(--transition-smooth)"
                            }}
                        >
                            <Image size={18} color="var(--accent-primary)" />
                            <span style={{ fontSize: "0.88rem", color: thumbnail ? "var(--text-primary)" : "var(--text-muted)", flex: 1 }}>
                                {thumbnail ? thumbnail.name : "Select an image file (.jpg, .png, .webp)"}
                            </span>
                            {thumbnail && (
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setThumbnail(null); }}
                                    style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "28px" }}>
                        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={uploading}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={uploading}>
                            {uploading ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    <span>Publishing Media...</span>
                                </>
                            ) : (
                                <>
                                    <UploadCloud size={16} />
                                    <span>Publish Video</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UploadModal;
