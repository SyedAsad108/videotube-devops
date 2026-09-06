import React, { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import Navbar from "./components/Navbar.jsx";
import Sidebar from "./components/Sidebar.jsx";
import UploadModal from "./components/UploadModal.jsx";

// Pages
import HomePage from "./pages/HomePage.jsx";
import WatchPage from "./pages/WatchPage.jsx";
import ChannelPage from "./pages/ChannelPage.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import HistoryPage from "./pages/HistoryPage.jsx";
import LikedVideosPage from "./pages/LikedVideosPage.jsx";
import SubscriptionsPage from "./pages/SubscriptionsPage.jsx";

function App() {
    const [isUploadOpen, setIsUploadOpen] = useState(false);

    return (
        <AuthProvider>
            <BrowserRouter>
                <div className="app-container">
                    <Navbar onOpenUpload={() => setIsUploadOpen(true)} />

                    <div className="main-layout">
                        <Sidebar />

                        <main className="content-area">
                            <Routes>
                                <Route path="/" element={<HomePage />} />
                                <Route path="/watch/:videoId" element={<WatchPage />} />
                                <Route path="/c/:username" element={<ChannelPage />} />
                                <Route path="/auth" element={<AuthPage />} />
                                <Route path="/history" element={<HistoryPage />} />
                                <Route path="/liked-videos" element={<LikedVideosPage />} />
                                <Route path="/subscriptions" element={<SubscriptionsPage />} />
                            </Routes>
                        </main>
                    </div>

                    <UploadModal
                        isOpen={isUploadOpen}
                        onClose={() => setIsUploadOpen(false)}
                        onUploadSuccess={() => {
                            window.location.reload();
                        }}
                    />
                </div>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
