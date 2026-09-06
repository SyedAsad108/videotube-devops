import React, { createContext, useContext, useState, useEffect } from "react";
import API from "../api/client.js";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const refreshUser = async () => {
        try {
            const res = await API.get("/users/current-user");
            if (res.data?.data) {
                setUser(res.data.data);
            } else {
                setUser(null);
            }
        } catch {
            setUser(null);
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
        setUser(loggedUser);
        return loggedUser;
    };

    const register = async (formData) => {
        const res = await API.post("/users/register", formData, {
            headers: {
                "Content-Type": "multipart/form-data"
            }
        });
        return res.data?.data;
    };

    const logout = async () => {
        try {
            await API.post("/users/logout");
        } finally {
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
