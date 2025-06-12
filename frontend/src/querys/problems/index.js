import { useQuery, useMutation, useInfiniteQuery } from "@tanstack/react-query";
import { axiosClient } from "@/utils/axios";
import { queryClient } from "@/main";
import { toast } from "sonner";

// Get all problems with pagination and filtering
export const useProblems = (filters) => {
  return useQuery({
    queryKey: ["problems", filters],
    queryFn: async () => {
      const res = await axiosClient.get("/problems", {
        params: {
          ...filters,
          tags: filters.tags?.join(","),
        },
      });
      return res.data.data;
    },
    keepPreviousData: true,
    staleTime: 5 * 60 * 1000,
  });
};

// Infinite scroll version
export const useInfiniteProblems = (filters) => {
  return useInfiniteQuery({
    queryKey: ["problems", "infinite", filters],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await axiosClient.get("/problems", {
        params: {
          ...filters,
          page: pageParam,
          tags: filters.tags?.join(","),
        },
      });
      return res.data.data;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.problems.length < lastPage.pageSize) return undefined;
      return lastPage.page + 1;
    },
    staleTime: 5 * 60 * 1000,
  });
};

// Get single problem
export const useProblem = (id) => {
  return useQuery({
    queryKey: ["problems", id],
    queryFn: async () => {
      const res = await axiosClient.get(`/problems/${id}`);
      return res.data.data;
    },
  });
};

// Create problem
export const useCreateProblem = () => {
  return useMutation({
    mutationFn: async (problemData) => {
      const res = await axiosClient.post("/problems", problemData);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["problems"]);
      toast.success("Problem created successfully");
    },
  });
};

// Update problem
export const useUpdateProblem = (id) => {
  return useMutation({
    mutationFn: async (updatedData) => {
      const res = await axiosClient.put(`/problems/${id}`, updatedData);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["problems"]);
      queryClient.invalidateQueries(["problems", id]);
      toast.success("Problem updated successfully");
    },
  });
};

// Delete problem
export const useDeleteProblem = () => {
  return useMutation({
    mutationFn: async (id) => {
      await axiosClient.delete(`/problems/${id}`);
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries(["problems"]);
      queryClient.removeQueries(["problems", id]);
      toast.success("Problem deleted successfully");
    },
  });
};

// Problem stats
export const useProblemStats = () => {
  return useQuery({
    queryKey: ["problems", "stats"],
    queryFn: async () => {
      const res = await axiosClient.get("/problems/stats");
      return res.data.data;
    },
  });
};