import axios from "axios";

const API = axios.create({
    baseURL: "/api/v1",
    withCredentials: true,
    headers: {
        "Content-Type": "application/json"
    }
});

// Response interceptor to handle token expiry and auto-refresh
API.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If error is 401 and we haven't already retried
        if (
            error.response?.status === 401 &&
            !originalRequest._retry &&
            !originalRequest.url.includes("/users/login") &&
            !originalRequest.url.includes("/users/refresh-token")
        ) {
            originalRequest._retry = true;

            try {
                // Call refresh token endpoint
                await axios.post("/api/v1/users/refresh-token", {}, { withCredentials: true });
                // Retry original request
                return API(originalRequest);
            } catch (refreshError) {
                // If refresh also fails, redirect to login or clear auth
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default API;
