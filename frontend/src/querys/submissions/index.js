import { useQuery, useMutation } from "@tanstack/react-query";
import { axiosClient } from "@/utils/axios";
import { queryClient } from "@/main";
import { toast } from "sonner";

// Get user submissions
export const useSubmissions = (userId) => {
  return useQuery({
    queryKey: ["submissions", { userId }],
    queryFn: async () => {
      const res = await axiosClient.get("/submissions", {
        params: { userId },
      });
      return res.data.data;
    },
    enabled: !!userId,
  });
};

// Get submission by ID
export const useSubmission = (id) => {
  return useQuery({
    queryKey: ["submissions", id],
    queryFn: async () => {
      const res = await axiosClient.get(`/submissions/${id}`);
      return res.data.data;
    },
  });
};

// Submit code
export const useSubmitCode = () => {
  return useMutation({
    mutationFn: async ({ problemId, code, language }) => {
      const res = await axiosClient.post(`/submissions`, {
        problemId,
        code,
        language,
      });
      return res.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(["submissions"]);
      queryClient.invalidateQueries(["problems", data.problemId, "submissions"]);
      toast.success("Code submitted successfully");
    },
  });
};