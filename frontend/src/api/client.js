import axios from "axios";

const API = axios.create({
    baseURL: "/api/v1",
    withCredentials: true,
    headers: {
        "Content-Type": "application/json"
    }
});

// Request interceptor to attach Authorization header if token exists in localStorage
API.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("videotube_token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor to handle token expiry and auto-refresh
API.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If error is 401 and we haven't already retried
        if (
            error.response?.status === 401 &&
            !originalRequest._retry &&
            !originalRequest.url?.includes("/users/login") &&
            !originalRequest.url?.includes("/users/refresh-token")
        ) {
            originalRequest._retry = true;

            try {
                // Call refresh token endpoint with both cookie and body payload
                const refreshToken = localStorage.getItem("videotube_refresh_token");
                const res = await axios.post(
                    "/api/v1/users/refresh-token",
                    { refreshToken },
                    { withCredentials: true }
                );

                const newAccessToken = res.data?.data?.accessToken;
                const newRefreshToken = res.data?.data?.refreshToken;

                if (newAccessToken) {
                    localStorage.setItem("videotube_token", newAccessToken);
                    originalRequest.headers = originalRequest.headers || {};
                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                }
                if (newRefreshToken) {
                    localStorage.setItem("videotube_refresh_token", newRefreshToken);
                }

                // Retry original request with updated token
                return API(originalRequest);
            } catch (refreshError) {
                // If refresh also fails, clear auth storage
                localStorage.removeItem("videotube_token");
                localStorage.removeItem("videotube_refresh_token");
                localStorage.removeItem("videotube_user");
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default API;
