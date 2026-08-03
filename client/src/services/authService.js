import api from "./api";

export const register = async (userData) => {
  const response = await api.post("/auth/register", userData);
  if (response.data.data?.accessToken) {
    localStorage.setItem("accessToken", response.data.data.accessToken);
  }
  if (response.data.data?.user) {
    localStorage.setItem("user", JSON.stringify(response.data.data.user));
  }
  return response.data;
};

export const login = async (credentials) => {
  const response = await api.post("/auth/login", credentials);
  if (response.data.data?.accessToken) {
    localStorage.setItem("accessToken", response.data.data.accessToken);
  }
  if (response.data.data?.user) {
    localStorage.setItem("user", JSON.stringify(response.data.data.user));
  }
  return response.data;
};

export const googleLogin = async (tokenPayload) => {
  let body = {};
  if (typeof tokenPayload === "string") {
    if (tokenPayload.startsWith("ya29.") || tokenPayload.split(".").length !== 3) {
      body = { access_token: tokenPayload };
    } else {
      body = { idToken: tokenPayload };
    }
  } else if (typeof tokenPayload === "object" && tokenPayload !== null) {
    body = tokenPayload;
  }
  const response = await api.post("/auth/google", body);
  if (response.data.data?.accessToken) {
    localStorage.setItem("accessToken", response.data.data.accessToken);
  }
  if (response.data.data?.user) {
    localStorage.setItem("user", JSON.stringify(response.data.data.user));
  }
  return response.data;
};

export const refreshTokens = async () => {
  const response = await api.post("/auth/refresh");
  if (response.data.data?.accessToken) {
    localStorage.setItem("accessToken", response.data.data.accessToken);
  }
  return response.data;
};

export const logout = async () => {
  try {
    await api.post("/auth/logout");
  } finally {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
  }
};

export const getProfile = async () => {
  const response = await api.get("/auth/profile");
  if (response.data.data?.user) {
    localStorage.setItem("user", JSON.stringify(response.data.data.user));
  }
  return response.data;
};

export const forgotPassword = async (email) => {
  const response = await api.post("/auth/forgot-password", { email });
  return response.data;
};

export const resetPassword = async (token, password) => {
  const response = await api.post("/auth/reset-password", { token, password });
  return response.data;
};

export const resendVerification = async (email) => {
  const response = await api.post("/auth/resend-verification", { email });
  return response.data;
};

export const verifyEmail = async (token) => {
  const response = await api.get("/auth/verify-email", { params: { token } });
  return response.data;
};

export default {
  register,
  login,
  googleLogin,
  refreshTokens,
  logout,
  getProfile,
  forgotPassword,
  resetPassword,
  resendVerification,
  verifyEmail,
};