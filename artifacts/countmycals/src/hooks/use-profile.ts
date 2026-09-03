import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from './use-auth';

export interface UserProfile {
  id: string;
  user_id: string;
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
  onboarding_completed: boolean;
}

export interface Store {
  id: string;
  name: string;
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
        .eq('user_id', user.id)
        .single();
        
      if (error) {
        if (error.code === 'PGRST116') return null; // not found
        throw error;
      }
      return data;
    },
    enabled: !!user && !!supabase,
  });
}

export function useUpdateProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (updates: Partial<UserProfile>) => {
      if (!supabase || !user) throw new Error('Not authenticated');
      
      const { data: existing } = await supabase
        .from('profils_utilisateurs')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (existing) {
        const { data, error } = await supabase
          .from('profils_utilisateurs')
          .update(updates)
          .eq('user_id', user.id)
          .select()
          .single();
          
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('profils_utilisateurs')
          .insert([{ user_id: user.id, ...updates }])
          .select()
          .single();
          
        if (error) throw error;
        return data;
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
      const { data, error } = await supabase.from('magasins').select('*').order('name');
      if (error) throw error;
      return data || [];
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
        .eq('user_id', user.id);
        
      if (error) throw error;
      return data.map(d => d.magasin_id);
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
        .eq('user_id', user.id);
      if (deleteError) throw deleteError;

      // Insert new
      if (storeIds.length > 0) {
        const { error } = await supabase
          .from('utilisateur_magasins')
          .insert(
            storeIds.map(id => ({ user_id: user.id, magasin_id: id }))
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
