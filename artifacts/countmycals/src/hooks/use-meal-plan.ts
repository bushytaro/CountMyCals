import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import {
  addDays,
  generateWeeklyMealPlan,
  type CanonicalIngredientRow,
  type GeneratedMealPlanItem,
  type MealSlot,
  type RecipeIngredientRow,
  type RecipeRow,
  type SauceCompatibilityRow,
  type StoreProductRow,
} from "@/lib/meal-plan";

export interface WeeklyMealPlan {
  id: string;
  startDate: string;
  items: GeneratedMealPlanItem[];
  averageDailyCalories: number;
  weeklyPrice: number;
}

interface PlanRow {
  id: string;
  semaine_debut: string;
}

interface PlanItemRow {
  jour: string;
  creneau: MealSlot;
  recette_id: string;
  portion_ratio: number | string;
  sauce_choisie_id: string | null;
  prix_calcule: number | string | null;
  kcal_calcule: number | string | null;
  proteines_calcule: number | string | null;
  glucides_calcule: number | string | null;
  lipides_calcule: number | string | null;
}

function numberValue(value: number | string | null | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function summarizePlan(
  id: string,
  startDate: string,
  items: GeneratedMealPlanItem[],
): WeeklyMealPlan {
  return {
    id,
    startDate,
    items,
    averageDailyCalories:
      Math.round(
        (items.reduce((sum, item) => sum + item.calories, 0) / 7) * 10,
      ) / 10,
    weeklyPrice:
      Math.round(
        items.reduce((sum, item) => sum + item.price, 0) * 100,
      ) / 100,
  };
}

export function useMealPlan() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["meal-plan", user?.id],
    queryFn: async (): Promise<WeeklyMealPlan | null> => {
      if (!supabase || !user) return null;

      const { data: plan, error: planError } = await supabase
        .from("plans_repas")
        .select("id, semaine_debut")
        .eq("utilisateur_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (planError) throw planError;
      if (!plan) return null;

      const { data: storedItems, error: itemsError } = await supabase
        .from("plans_repas_items")
        .select(
          "jour, creneau, recette_id, portion_ratio, sauce_choisie_id, prix_calcule, kcal_calcule, proteines_calcule, glucides_calcule, lipides_calcule",
        )
        .eq("plan_id", plan.id)
        .order("jour", { ascending: true });
      if (itemsError) throw itemsError;

      const recipeIds = Array.from(
        new Set(
          (storedItems ?? []).flatMap((item) =>
            [item.recette_id, item.sauce_choisie_id].filter(
              (id): id is string => Boolean(id),
            ),
          ),
        ),
      );
      const recipeNames = new Map<string, string>();

      if (recipeIds.length > 0) {
        const { data: recipes, error: recipesError } = await supabase
          .from("recettes")
          .select("id, nom")
          .in("id", recipeIds);
        if (recipesError) throw recipesError;
        for (const recipe of recipes ?? []) {
          recipeNames.set(recipe.id, recipe.nom);
        }
      }

      const items = ((storedItems ?? []) as PlanItemRow[]).map((item) => ({
        day: item.jour,
        slot: item.creneau,
        recipeId: item.recette_id,
        recipeName:
          recipeNames.get(item.recette_id) ?? "Recette indisponible",
        sauceId: item.sauce_choisie_id,
        sauceName: item.sauce_choisie_id
          ? recipeNames.get(item.sauce_choisie_id) ?? null
          : null,
        portionRatio: numberValue(item.portion_ratio),
        price: numberValue(item.prix_calcule),
        calories: numberValue(item.kcal_calcule),
        protein: numberValue(item.proteines_calcule),
        carbs: numberValue(item.glucides_calcule),
        fat: numberValue(item.lipides_calcule),
      }));

      return summarizePlan(plan.id, plan.semaine_debut, items);
    },
    enabled: Boolean(supabase && user),
    retry: false,
  });
}

export function useGenerateMealPlan() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<WeeklyMealPlan> => {
      if (!supabase || !user) throw new Error("Tu dois être connecté.");
      if (!profile) {
        throw new Error("Termine ton profil avant de générer un plan.");
      }
      if (!profile.calories_goal || !profile.grocery_budget) {
        throw new Error(
          "Renseigne ton objectif calorique et ton budget hebdomadaire.",
        );
      }

      const [
        recipesResponse,
        recipeIngredientsResponse,
        ingredientsResponse,
        productsResponse,
        saucesResponse,
      ] = await Promise.all([
        supabase
          .from("recettes")
          .select(
            "id, nom, categorie, four, micro_onde, casserole, poele, mixeur, nb_portions",
          ),
        supabase
          .from("recette_ingredients")
          .select("recette_id, ingredient_canonique_id, quantite"),
        supabase
          .from("ingredients_canoniques")
          .select(
            "id, kcal_100g, proteines_100g, glucides_100g, lipides_100g",
          ),
        supabase
          .from("produits_magasin")
          .select("ingredient_canonique_id, prix_actuel"),
        supabase
          .from("recette_sauces_compatibles")
          .select("recette_id, sauce_id"),
      ]);

      if (recipesResponse.error) throw recipesResponse.error;
      if (recipeIngredientsResponse.error)
        throw recipeIngredientsResponse.error;
      if (ingredientsResponse.error) throw ingredientsResponse.error;
      if (productsResponse.error) throw productsResponse.error;
      if (saucesResponse.error) throw saucesResponse.error;

      const startDate = new Date();
      const startDateString = addDays(startDate, 0);
      const generatedItems = generateWeeklyMealPlan({
        profile,
        recipes: (recipesResponse.data ?? []) as RecipeRow[],
        recipeIngredients: (recipeIngredientsResponse.data ??
          []) as RecipeIngredientRow[],
        canonicalIngredients: (ingredientsResponse.data ??
          []) as CanonicalIngredientRow[],
        products: (productsResponse.data ?? []) as StoreProductRow[],
        sauceCompatibilities: (saucesResponse.data ??
          []) as SauceCompatibilityRow[],
        startDate,
      });

      const { data: createdPlan, error: planError } = await supabase
        .from("plans_repas")
        .insert({
          utilisateur_id: user.id,
          semaine_debut: startDateString,
        })
        .select("id, semaine_debut")
        .single();
      if (planError) throw planError;

      if (generatedItems.length > 0) {
        const { error: itemsError } = await supabase
          .from("plans_repas_items")
          .insert(
            generatedItems.map((item) => ({
              plan_id: createdPlan.id,
              jour: item.day,
              creneau: item.slot,
              recette_id: item.recipeId,
              portion_ratio: item.portionRatio,
              sauce_choisie_id: item.sauceId,
              prix_calcule: item.price,
              kcal_calcule: item.calories,
              proteines_calcule: item.protein,
              glucides_calcule: item.carbs,
              lipides_calcule: item.fat,
            })),
          );

        if (itemsError) {
          await supabase
            .from("plans_repas")
            .delete()
            .eq("id", createdPlan.id);
          throw itemsError;
        }
      }

      const { error: deleteOldPlansError } = await supabase
        .from("plans_repas")
        .delete()
        .eq("utilisateur_id", user.id)
        .neq("id", createdPlan.id);

      if (deleteOldPlansError) {
        await supabase
          .from("plans_repas")
          .delete()
          .eq("id", createdPlan.id);
        throw deleteOldPlansError;
      }

      return summarizePlan(
        createdPlan.id,
        createdPlan.semaine_debut,
        generatedItems,
      );
    },
    onSuccess: (plan) => {
      queryClient.setQueryData(["meal-plan", user?.id], plan);
    },
  });
}