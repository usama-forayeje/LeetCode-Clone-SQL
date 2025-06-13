
import { axiosClient } from "@/utils/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { toast } from "sonner";

// Auth keys for query client
export const authKeys = {
  all: ["auth"],
  currentUser: () => [...authKeys.all, "current-user"],
};

// Get current authenticated user
export const useCurrentUser = () => {
  return useQuery({
    queryKey: authKeys.currentUser(),
    queryFn: async () => {
      const res = await axiosClient.get("/users/me");
      return res.data.data;
    },
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error) => {
      // Don't retry for 401 errors
      if (error.response?.status === 401) return false;
      return failureCount < 3;
    },
  });
};

// Sign up mutation
export const useSignUp = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (credentials) => {
      const res = await axiosClient.post("/auth/sign-up", credentials);
      return res.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(authKeys.currentUser());
      toast.success("Account created successfully!");
      navigate("/verify-email", { state: { email: data.email } });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Sign up failed");
    },
  });
};

// Sign in mutation
export const useSignIn = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (credentials) => {
      const res = await axiosClient.post("/auth/sign-in", credentials);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(authKeys.currentUser());
      navigate("/dashboard");
      toast.success("Welcome back!");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Invalid credentials");
    },
  });
};

// Google authentication
export const useGoogleAuth = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (token) => {
      const res = await axiosClient.post("/auth/google-login", { token });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(authKeys.currentUser());
      navigate("/dashboard");
      toast.success("Google authentication successful");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Google authentication failed");
    },
  });
};

// Sign out mutation
export const useSignOut = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async () => {
      await axiosClient.post("/auth/sign-out");
    },
    onSuccess: () => {
      queryClient.removeQueries();
      navigate("/sign-in", { replace: true });
      toast.success("You've been signed out");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Sign out failed");
    },
  });
};

// Password reset mutations
export const useForgotPassword = () => {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (email) => {
      await axiosClient.post("/auth/forgot-password", { email });
    },
    onSuccess: () => {
      toast.success("Password reset link sent to your email");
      navigate("/sign-in");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to send reset link");
    },
  });
};

export const useResetPassword = () => {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async ({ token, password }) => {
      await axiosClient.post(`/auth/reset-password/${token}`, { password });
    },
    onSuccess: () => {
      navigate("/sign-in");
      toast.success("Password reset successfully");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Password reset failed");
    },
  });
};

// Email verification
export const useVerifyEmail = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (token) => {
      const res = await axiosClient.post(`/auth/verify-email/${token}`);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(authKeys.currentUser());
      navigate("/dashboard");
      toast.success("Email verified successfully");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Email verification failed");
    },
  });
};

export const useResendVerificationEmail = () => {
  return useMutation({
    mutationFn: async (email) => {
      await axiosClient.post("/auth/resend-verification", { email });
    },
    onSuccess: () => {
      toast.success("Verification email sent");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to resend verification email");
    },
  });
};