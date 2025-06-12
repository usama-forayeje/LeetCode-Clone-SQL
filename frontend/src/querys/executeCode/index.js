import { useMutation } from "@tanstack/react-query";
import { axiosClient } from "@/utils/axios";
import { toast } from "sonner";

// Execute code without submission
export const useExecuteCode = () => {
  return useMutation({
    mutationFn: async ({ problemId, code, language }) => {
      const res = await axiosClient.post(`/execute`, {
        problemId,
        code,
        language,
      });
      return res.data.data;
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Execution failed");
    },
  });
};

// Submit code (creates submission)
export const useSubmitCode = () => {
  return useMutation({
    mutationFn: async ({ problemId, code, language }) => {
      const res = await axiosClient.post(`/execute/submit`, {
        problemId,
        code,
        language,
      });
      return res.data.data;
    },
    onSuccess: () => {
      toast.success("Code submitted successfully");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Submission failed");
    },
  });
};