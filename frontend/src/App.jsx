import React, { useState, Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import Navbar from "./components/Navbar.jsx";
import Sidebar from "./components/Sidebar.jsx";
import { Loader2 } from "lucide-react";

// Critical landing page: loaded eagerly for instantaneous First Contentful Paint
import HomePage from "./pages/HomePage.jsx";

// Route-based code splitting: secondary & heavy pages loaded on-demand
const WatchPage = lazy(() => import("./pages/WatchPage.jsx"));
const ChannelPage = lazy(() => import("./pages/ChannelPage.jsx"));
const AuthPage = lazy(() => import("./pages/AuthPage.jsx"));
const HistoryPage = lazy(() => import("./pages/HistoryPage.jsx"));
const LikedVideosPage = lazy(() => import("./pages/LikedVideosPage.jsx"));
const SubscriptionsPage = lazy(() => import("./pages/SubscriptionsPage.jsx"));

// Component-level lazy loading: UploadModal is loaded only when triggered by user
const UploadModal = lazy(() => import("./components/UploadModal.jsx"));

// Polished fallback loader matching VideoTube dark theme asada
const PageLoader = () => (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "55vh" }}>
        <Loader2 size={36} color="var(--accent-primary)" className="animate-spin" />
    </div>
);

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
                            <Suspense fallback={<PageLoader />}>
                                <Routes>
                                    <Route path="/" element={<HomePage />} />
                                    <Route path="/watch/:videoId" element={<WatchPage />} />
                                    <Route path="/c/:username" element={<ChannelPage />} />
                                    <Route path="/auth" element={<AuthPage />} />
                                    <Route path="/history" element={<HistoryPage />} />
                                    <Route path="/liked-videos" element={<LikedVideosPage />} />
                                    <Route path="/subscriptions" element={<SubscriptionsPage />} />
                                </Routes>
                            </Suspense>
                        </main>
                    </div>

                    {isUploadOpen && (
                        <Suspense fallback={null}>
                            <UploadModal
                                isOpen={isUploadOpen}
                                onClose={() => setIsUploadOpen(false)}
                                onUploadSuccess={() => {
                                    window.location.reload();
                                }}
                            />
                        </Suspense>
                    )}
                </div>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
