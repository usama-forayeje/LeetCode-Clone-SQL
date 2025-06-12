import { useQuery, useMutation } from "@tanstack/react-query";
import { axiosClient } from "@/utils/axios";
import { queryClient } from "@/main";
import { toast } from "sonner";

// Get all playlists
export const usePlaylists = () => {
  return useQuery({
    queryKey: ["playlists"],
    queryFn: async () => {
      const res = await axiosClient.get("/playlists");
      return res.data.data;
    },
  });
};

// Get single playlist
export const usePlaylist = (id) => {
  return useQuery({
    queryKey: ["playlists", id],
    queryFn: async () => {
      const res = await axiosClient.get(`/playlists/${id}`);
      return res.data.data;
    },
  });
};

// Create playlist
export const useCreatePlaylist = () => {
  return useMutation({
    mutationFn: async (playlistData) => {
      const res = await axiosClient.post("/playlists", playlistData);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["playlists"]);
      toast.success("Playlist created successfully");
    },
  });
};

// Update playlist
export const useUpdatePlaylist = (id) => {
  return useMutation({
    mutationFn: async (updatedData) => {
      const res = await axiosClient.put(`/playlists/${id}`, updatedData);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["playlists"]);
      queryClient.invalidateQueries(["playlists", id]);
      toast.success("Playlist updated successfully");
    },
  });
};

// Add problems to playlist
export const useAddToPlaylist = (playlistId) => {
  return useMutation({
    mutationFn: async (problemIds) => {
      await axiosClient.post(`/playlists/${playlistId}/problems`, {
        problemIds,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["playlists", playlistId]);
      toast.success("Problems added to playlist");
    },
  });
};

// Remove problems from playlist
export const useRemoveFromPlaylist = (playlistId) => {
  return useMutation({
    mutationFn: async (problemIds) => {
      await axiosClient.delete(`/playlists/${playlistId}/problems`, {
        data: { problemIds },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["playlists", playlistId]);
      toast.success("Problems removed from playlist");
    },
  });
};