import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface Recipe {
  id: string;
  name: string;
  category: string;
  preparation_time: number;
}

export function useRecipes() {
  return useQuery({
    queryKey: ['recipes'],
    queryFn: async (): Promise<Recipe[]> => {
      if (!supabase) return [];
      const { data, error } = await supabase
        .from('recettes')
        .select('*')
        .order('name');
        
      if (error) throw error;
      return data || [];
    },
    enabled: !!supabase,
  });
}
