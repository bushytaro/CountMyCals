import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface Recipe {
  id: string;
  name: string;
  category: string;
  preparation_time: string | null;
}

export function useRecipes() {
  return useQuery({
    queryKey: ['recipes'],
    queryFn: async (): Promise<Recipe[]> => {
      if (!supabase) return [];
      const { data, error } = await supabase
        .from('recettes')
        .select('id, nom, categorie, temps_preparation')
        .order('nom');
        
      if (error) throw error;
      return (data || []).map((recipe) => ({
        id: recipe.id,
        name: recipe.nom,
        category: recipe.categorie,
        preparation_time: recipe.temps_preparation,
      }));
    },
    enabled: !!supabase,
  });
}
