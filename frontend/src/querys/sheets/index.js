import { useQuery, useMutation } from "@tanstack/react-query";
import { axiosClient } from "@/utils/axios";
import { queryClient } from "@/main";
import { toast } from "sonner";

// Get all sheets
export const useSheets = () => {
  return useQuery({
    queryKey: ["sheets"],
    queryFn: async () => {
      const res = await axiosClient.get("/sheets");
      return res.data.data;
    },
  });
};

// Get sheet by ID
export const useSheet = (id) => {
  return useQuery<Sheet>({
    queryKey: ["sheets", id],
    queryFn: async () => {
      const res = await axiosClient.get(`/sheets/${id}`);
      return res.data.data;
    },
  });
};

// Admin: Create sheet
export const useCreateSheet = () => {
  return useMutation({
    mutationFn: async (sheetData) => {
      const res = await axiosClient.post("/sheets", sheetData);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["sheets"]);
      toast.success("Sheet created successfully");
    },
  });
};

// Admin: Update sheet
export const useUpdateSheet = (id) => {
  return useMutation<Sheet, Error, Partial<Sheet>>({
    mutationFn: async (updatedData) => {
      const res = await axiosClient.put(`/sheets/${id}`, updatedData);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["sheets"]);
      queryClient.invalidateQueries(["sheets", id]);
      toast.success("Sheet updated successfully");
    },
  });
};

// Admin: Manage sheet problems
export const useManageSheetProblems = (sheetId) => {
  return useMutation({
    mutationFn: async (action) => {
      const { type, problemIds } = action;
      if (type === "add") {
        await axiosClient.post(`/sheets/${sheetId}/problems`, { problemIds });
      } else {
        await axiosClient.delete(`/sheets/${sheetId}/problems`, {
          data: { problemIds },
        });
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(["sheets", sheetId]);
      toast.success(
        `Problems ${variables.type === "add" ? "added to" : "removed from"} sheet`
      );
    },
  });
};