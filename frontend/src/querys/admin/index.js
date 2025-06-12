import { useQuery, useMutation } from "@tanstack/react-query";
import { axiosClient } from "@/utils/axios";
import { queryClient } from "@/main";
import { toast } from "sonner";

// Admin dashboard stats
export const useAdminStats = () => {
  return useQuery<AdminStats>({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      const res = await axiosClient.get("/admin/stats");
      return res.data.data;
    },
  });
};

// User management
export const useAdminUsers = () => {
  return useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const res = await axiosClient.get("/users");
      return res.data.data;
    },
  });
};

export const useDeleteUser = () => {
  return useMutation({
    mutationFn: async (userId) => {
      await axiosClient.delete(`/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["admin", "users"]);
      toast.success("User deleted successfully");
    },
  });
};

// Problem management
export const useAdminProblems = () => {
  return useQuery({
    queryKey: ["admin", "problems"],
    queryFn: async () => {
      const res = await axiosClient.get("/problems");
      return res.data.data;
    },
  });
};

// Submission management
export const useAdminSubmissions = () => {
  return useQuery({
    queryKey: ["admin", "submissions"],
    queryFn: async () => {
      const res = await axiosClient.get("/submissions");
      return res.data.data;
    },
  });
};

export const useDeleteSubmission = () => {
  return useMutation({
    mutationFn: async (submissionId) => {
      await axiosClient.delete(`/submissions/${submissionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["admin", "submissions"]);
      toast.success("Submission deleted successfully");
    },
  });
};