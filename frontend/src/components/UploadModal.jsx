import React, { useState } from "react";
import API from "../api/client.js";
import { X, UploadCloud, Loader2 } from "lucide-react";

const UploadModal = ({ isOpen, onClose, onUploadSuccess }) => {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [videoFile, setVideoFile] = useState(null);
    const [thumbnail, setThumbnail] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");

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
                    <h2>Publish New Video</h2>
                    <button className="btn btn-secondary" onClick={onClose} style={{ padding: "6px" }}>
                        <X size={18} />
                    </button>
                </div>

                {error && <div className="alert-box">{error}</div>}

                <form onSubmit={handleSubmit}>
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
                        <label>Video File (.mp4, .webm, .mkv) *</label>
                        <input
                            type="file"
                            accept="video/*"
                            onChange={(e) => setVideoFile(e.target.files[0])}
                            disabled={uploading}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Thumbnail Image (Optional)</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setThumbnail(e.target.files[0])}
                            disabled={uploading}
                        />
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
                        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={uploading}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={uploading}>
                            {uploading ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    <span>Uploading Media...</span>
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
