import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from './use-auth';

export interface UserProfile {
  id: string;
  calories_goal: number | null;
  protein_goal: number | null;
  carbs_goal: number | null;
  fat_goal: number | null;
  grocery_budget: number | null;
  has_oven: boolean;
  has_microwave: boolean;
  has_saucepan: boolean;
  has_pan: boolean;
  has_blender: boolean;
}

export interface Store {
  id: string;
  name: string;
}

interface UserProfileRow {
  id: string;
  objectif_kcal: number | null;
  objectif_proteines_g: number | null;
  objectif_glucides_g: number | null;
  objectif_lipides_g: number | null;
  budget_hebdomadaire: number | null;
  four: boolean;
  micro_onde: boolean;
  casserole: boolean;
  poele: boolean;
  mixeur: boolean;
}

function fromProfileRow(row: UserProfileRow): UserProfile {
  return {
    id: row.id,
    calories_goal: row.objectif_kcal,
    protein_goal: row.objectif_proteines_g,
    carbs_goal: row.objectif_glucides_g,
    fat_goal: row.objectif_lipides_g,
    grocery_budget: row.budget_hebdomadaire,
    has_oven: row.four,
    has_microwave: row.micro_onde,
    has_saucepan: row.casserole,
    has_pan: row.poele,
    has_blender: row.mixeur,
  };
}

function toProfileRow(updates: Partial<UserProfile>): Partial<UserProfileRow> {
  const row: Partial<UserProfileRow> = {};

  if (updates.calories_goal !== undefined) row.objectif_kcal = updates.calories_goal;
  if (updates.protein_goal !== undefined) row.objectif_proteines_g = updates.protein_goal;
  if (updates.carbs_goal !== undefined) row.objectif_glucides_g = updates.carbs_goal;
  if (updates.fat_goal !== undefined) row.objectif_lipides_g = updates.fat_goal;
  if (updates.grocery_budget !== undefined) row.budget_hebdomadaire = updates.grocery_budget;
  if (updates.has_oven !== undefined) row.four = updates.has_oven;
  if (updates.has_microwave !== undefined) row.micro_onde = updates.has_microwave;
  if (updates.has_saucepan !== undefined) row.casserole = updates.has_saucepan;
  if (updates.has_pan !== undefined) row.poele = updates.has_pan;
  if (updates.has_blender !== undefined) row.mixeur = updates.has_blender;

  return row;
}

export function useProfile() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async (): Promise<UserProfile | null> => {
      if (!supabase || !user) return null;
      
      const { data, error } = await supabase
        .from('profils_utilisateurs')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
        
      if (error) throw error;
      return data ? fromProfileRow(data as UserProfileRow) : null;
    },
    enabled: !!user && !!supabase,
    retry: false,
  });
}

export function useUpdateProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (updates: Partial<UserProfile>) => {
      if (!supabase || !user) throw new Error('Not authenticated');
      const databaseUpdates = toProfileRow(updates);
      
      const { data: existing, error: existingError } = await supabase
        .from('profils_utilisateurs')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();
      if (existingError) throw existingError;

      if (existing) {
        const { data, error } = await supabase
          .from('profils_utilisateurs')
          .update(databaseUpdates)
          .eq('id', user.id)
          .select()
          .single();
          
        if (error) throw error;
        return fromProfileRow(data as UserProfileRow);
      } else {
        const { data, error } = await supabase
          .from('profils_utilisateurs')
          .insert([{ id: user.id, ...databaseUpdates }])
          .select()
          .single();
          
        if (error) throw error;
        return fromProfileRow(data as UserProfileRow);
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['profile', user?.id], data);
    }
  });
}

export function useStores() {
  return useQuery({
    queryKey: ['stores'],
    queryFn: async (): Promise<Store[]> => {
      if (!supabase) return [];
      const { data, error } = await supabase
        .from('magasins')
        .select('id, nom')
        .order('nom');
      if (error) throw error;
      return (data || []).map((store) => ({
        id: String(store.id),
        name: store.nom,
      }));
    },
    enabled: !!supabase,
  });
}

export function useUserStores() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['user_stores', user?.id],
    queryFn: async (): Promise<string[]> => {
      if (!supabase || !user) return [];
      const { data, error } = await supabase
        .from('utilisateur_magasins')
        .select('magasin_id')
        .eq('utilisateur_id', user.id);
        
      if (error) throw error;
      return data.map(d => String(d.magasin_id));
    },
    enabled: !!user && !!supabase,
  });
}

export function useUpdateUserStores() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (storeIds: string[]) => {
      if (!supabase || !user) throw new Error('Not authenticated');
      
      const { error: deleteError } = await supabase
        .from('utilisateur_magasins')
        .delete()
        .eq('utilisateur_id', user.id);
      if (deleteError) throw deleteError;

      // Insert new
      if (storeIds.length > 0) {
        const { error } = await supabase
          .from('utilisateur_magasins')
          .insert(
            storeIds.map(id => ({
              utilisateur_id: user.id,
              magasin_id: Number(id),
            }))
          );
        if (error) throw error;
      }
      return storeIds;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['user_stores', user?.id], data);
    }
  });
}
