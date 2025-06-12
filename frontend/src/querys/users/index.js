import { useQuery, useMutation } from "@tanstack/react-query";
import { axiosClient } from "@/utils/axios";
import { queryClient } from "@/main";
import { toast } from "sonner";

// Get current user profile
export const useCurrentUser = () => {
  return useQuery({
    queryKey: ["users", "me"],
    queryFn: async () => {
      const res = await axiosClient.get("/users/me");
      return res.data.data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

// Update user profile
export const useUpdateProfile = () => {
  return useMutation({
    mutationFn: async (profileData) => {
      const res = await axiosClient.patch("/users/me", profileData);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["users", "me"]);
      toast.success("Profile updated successfully");
    },
  });
};

// Update profile picture
export const useUpdateAvatar = () => {
  return useMutation({
    mutationFn: async (formData) => {
      const res = await axiosClient.patch("/users/me/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["users", "me"]);
      toast.success("Profile picture updated");
    },
  });
};

// Change password
export const useChangePassword = () => {
  return useMutation({
    mutationFn: async ({
      currentPassword,
      newPassword,
    }) => {
      await axiosClient.put("/users/me/password", {
        currentPassword,
        newPassword,
      });
    },
    onSuccess: () => {
      toast.success("Password changed successfully");
    },
  });
};