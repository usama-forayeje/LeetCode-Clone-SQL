import { axiosClient } from "@/utils/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { toast } from "sonner";

// Get current authenticated user
export const useCurrentUser = () => {
  return useQuery({
    queryKey: ["auth", "current-user"],
    queryFn: async () => {
      const res = await axiosClient.get("/users/me");
      return res.data.data;
    },
    staleTime: 5 * 60 * 1000,
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
    onSuccess: () => {
      queryClient.invalidateQueries(["auth", "current-user"]);
      navigate("/dashboard");
      toast.success("Account created successfully");
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
      queryClient.invalidateQueries(["auth", "current-user"]);
      navigate("/dashboard");
      toast.success("Logged in successfully");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Invalid credentials");
    },
  });
};

// Google authentication
export const useGoogleAuth = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (token) => {
      const res = await axiosClient.post("/auth/google", token);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["auth", "current-user"]);
      toast.success("Google authentication successful");
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
    },
  });
};

// Password reset mutations
export const useForgotPassword = () => {
  return useMutation({
    mutationFn: async (email) => {
      await axiosClient.post("/auth/forgot-password", { email });
    },
    onSuccess: () => toast.success("Password reset link sent to your email"),
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
  });
};