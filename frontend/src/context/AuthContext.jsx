import React, { createContext, useContext, useState, useEffect } from "react";
import API from "../api/client.js";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        try {
            const saved = localStorage.getItem("videotube_user");
            return saved ? JSON.parse(saved) : null;
        } catch {
            return null;
        }
    });
    const [loading, setLoading] = useState(true);

    const refreshUser = async () => {
        const token = localStorage.getItem("videotube_token");
        try {
            const res = await API.get("/users/current-user");
            if (res.data?.data) {
                setUser(res.data.data);
                localStorage.setItem("videotube_user", JSON.stringify(res.data.data));
            } else {
                setUser(null);
                localStorage.removeItem("videotube_token");
                localStorage.removeItem("videotube_refresh_token");
                localStorage.removeItem("videotube_user");
            }
        } catch (error) {
            // Only clear auth if server says 401 Unauthorized or no token exists
            if (!token || error.response?.status === 401) {
                setUser(null);
                localStorage.removeItem("videotube_token");
                localStorage.removeItem("videotube_refresh_token");
                localStorage.removeItem("videotube_user");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshUser();
    }, []);

    const login = async (usernameOrEmail, password) => {
        const payload = usernameOrEmail.includes("@")
            ? { email: usernameOrEmail, password }
            : { username: usernameOrEmail, password };

        const res = await API.post("/users/login", payload);
        const loggedUser = res.data?.data?.user;
        const accessToken = res.data?.data?.accessToken;
        const refreshToken = res.data?.data?.refreshToken;

        if (accessToken) {
            localStorage.setItem("videotube_token", accessToken);
        }
        if (refreshToken) {
            localStorage.setItem("videotube_refresh_token", refreshToken);
        }
        if (loggedUser) {
            localStorage.setItem("videotube_user", JSON.stringify(loggedUser));
            setUser(loggedUser);
        }
        return loggedUser;
    };

    const register = async (userData) => {
        const res = await API.post("/users/register", userData);
        const loggedUser = res.data?.data?.user;
        const accessToken = res.data?.data?.accessToken;
        const refreshToken = res.data?.data?.refreshToken;

        if (accessToken) {
            localStorage.setItem("videotube_token", accessToken);
        }
        if (refreshToken) {
            localStorage.setItem("videotube_refresh_token", refreshToken);
        }
        if (loggedUser) {
            localStorage.setItem("videotube_user", JSON.stringify(loggedUser));
            setUser(loggedUser);
        }
        return res.data?.data;
    };

    const logout = async () => {
        try {
            await API.post("/users/logout");
        } catch (error) {
            console.warn("Logout API call warning:", error?.message);
        } finally {
            localStorage.removeItem("videotube_token");
            localStorage.removeItem("videotube_refresh_token");
            localStorage.removeItem("videotube_user");
            setUser(null);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
