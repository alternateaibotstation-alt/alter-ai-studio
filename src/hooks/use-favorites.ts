import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function useFavorites() {
  const queryClient = useQueryClient();

  const { data: favoriteIds = [], isLoading } = useQuery({
    queryKey: ["favorites"],
    queryFn: api.getFavorites,
    staleTime: 30_000,
  });

  const toggleMutation = useMutation({
    mutationFn: api.toggleFavorite,
    onMutate: async (botId) => {
      await queryClient.cancelQueries({ queryKey: ["favorites"] });
      const prev = queryClient.getQueryData<string[]>(["favorites"]) ?? [];
      const next = prev.includes(botId) ? prev.filter((id) => id !== botId) : [...prev, botId];
      queryClient.setQueryData(["favorites"], next);
      return { prev };
    },
    onError: (_err, _botId, context) => {
      queryClient.setQueryData(["favorites"], context?.prev);
      toast.error("Please sign in to favorite bots");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["favorites"] }),
  });

  return {
    favoriteIds,
    isLoading,
    isFavorite: (botId: string) => favoriteIds.includes(botId),
    toggleFavorite: (botId: string) => toggleMutation.mutate(botId),
  };
}
