import type { UserProfile } from "@/hooks/use-profile";

export const MEAL_SLOTS = [
  {
    key: "Petit-dejeuner",
    label: "Petit-déjeuner",
    category: "Encas",
    calorieShare: 0.2,
    budgetShare: 0.2,
  },
  {
    key: "Dejeuner",
    label: "Déjeuner",
    category: "Plat",
    calorieShare: 0.35,
    budgetShare: 0.35,
  },
  {
    key: "Diner",
    label: "Dîner",
    category: "Plat",
    calorieShare: 0.35,
    budgetShare: 0.35,
  },
  {
    key: "Collation",
    label: "Collation / Dessert",
    category: "Encas",
    calorieShare: 0.1,
    budgetShare: 0.1,
  },
] as const;

export type MealSlot = (typeof MEAL_SLOTS)[number]["key"];
export type RecipeCategory = "Plat" | "Encas" | "Sauce";

export interface NutritionTotals {
  price: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface RecipeRow {
  id: string;
  nom: string;
  categorie: RecipeCategory;
  four: boolean;
  micro_onde: boolean;
  casserole: boolean;
  poele: boolean;
  mixeur: boolean;
  nb_portions: number | string | null;
}

export interface RecipeIngredientRow {
  recette_id: string;
  ingredient_canonique_id: string | null;
  quantite: number | string | null;
}

export interface CanonicalIngredientRow {
  id: string;
  kcal_100g: number | string | null;
  proteines_100g: number | string | null;
  glucides_100g: number | string | null;
  lipides_100g: number | string | null;
}

export interface StoreProductRow {
  ingredient_canonique_id: string;
  prix_actuel: number | string;
}

export interface SauceCompatibilityRow {
  recette_id: string;
  sauce_id: string;
}

export interface GeneratedMealPlanItem extends NutritionTotals {
  day: string;
  slot: MealSlot;
  recipeId: string;
  recipeName: string;
  sauceId: string | null;
  sauceName: string | null;
  portionRatio: number;
}

interface ComputedRecipe extends RecipeRow {
  totals: NutritionTotals;
}

function numberValue(value: number | string | null | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function round(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function localDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDays(date: Date, days: number): string {
  const nextDate = new Date(date);
  nextDate.setHours(12, 0, 0, 0);
  nextDate.setDate(nextDate.getDate() + days);
  return localDateString(nextDate);
}

function equipmentCompatible(
  recipe: RecipeRow,
  profile: UserProfile,
): boolean {
  return (
    (!recipe.four || profile.has_oven) &&
    (!recipe.micro_onde || profile.has_microwave) &&
    (!recipe.casserole || profile.has_saucepan) &&
    (!recipe.poele || profile.has_pan) &&
    (!recipe.mixeur || profile.has_blender)
  );
}

function scaleTotals(totals: NutritionTotals, ratio: number): NutritionTotals {
  return {
    price: totals.price * ratio,
    calories: totals.calories * ratio,
    protein: totals.protein * ratio,
    carbs: totals.carbs * ratio,
    fat: totals.fat * ratio,
  };
}

function addTotals(
  first: NutritionTotals,
  second?: NutritionTotals,
): NutritionTotals {
  if (!second) return first;

  return {
    price: first.price + second.price,
    calories: first.calories + second.calories,
    protein: first.protein + second.protein,
    carbs: first.carbs + second.carbs,
    fat: first.fat + second.fat,
  };
}

function computeRecipes(
  recipes: RecipeRow[],
  recipeIngredients: RecipeIngredientRow[],
  canonicalIngredients: CanonicalIngredientRow[],
  products: StoreProductRow[],
): ComputedRecipe[] {
  const ingredientsById = new Map(
    canonicalIngredients.map((ingredient) => [ingredient.id, ingredient]),
  );
  const priceByIngredient = new Map<string, number>();

  for (const product of products) {
    const price = numberValue(product.prix_actuel);
    const currentPrice = priceByIngredient.get(product.ingredient_canonique_id);
    if (currentPrice === undefined || price < currentPrice) {
      priceByIngredient.set(product.ingredient_canonique_id, price);
    }
  }

  const linesByRecipe = new Map<string, RecipeIngredientRow[]>();
  for (const line of recipeIngredients) {
    const lines = linesByRecipe.get(line.recette_id) ?? [];
    lines.push(line);
    linesByRecipe.set(line.recette_id, lines);
  }

  return recipes.map((recipe) => {
    const portions = Math.max(1, numberValue(recipe.nb_portions) || 1);
    const totals = (linesByRecipe.get(recipe.id) ?? []).reduce<NutritionTotals>(
      (sum, line) => {
        const quantity = numberValue(line.quantite);
        if (!line.ingredient_canonique_id || quantity <= 0) return sum;

        const ingredient = ingredientsById.get(line.ingredient_canonique_id);
        const factor = quantity / 100 / portions;

        return {
          price:
            sum.price +
            factor * (priceByIngredient.get(line.ingredient_canonique_id) ?? 0),
          calories: sum.calories + factor * numberValue(ingredient?.kcal_100g),
          protein:
            sum.protein + factor * numberValue(ingredient?.proteines_100g),
          carbs:
            sum.carbs + factor * numberValue(ingredient?.glucides_100g),
          fat: sum.fat + factor * numberValue(ingredient?.lipides_100g),
        };
      },
      { price: 0, calories: 0, protein: 0, carbs: 0, fat: 0 },
    );

    return { ...recipe, totals };
  });
}

export function generateWeeklyMealPlan({
  profile,
  recipes,
  recipeIngredients,
  canonicalIngredients,
  products,
  sauceCompatibilities,
  startDate = new Date(),
}: {
  profile: UserProfile;
  recipes: RecipeRow[];
  recipeIngredients: RecipeIngredientRow[];
  canonicalIngredients: CanonicalIngredientRow[];
  products: StoreProductRow[];
  sauceCompatibilities: SauceCompatibilityRow[];
  startDate?: Date;
}): GeneratedMealPlanItem[] {
  const computedRecipes = computeRecipes(
    recipes,
    recipeIngredients,
    canonicalIngredients,
    products,
  );
  const recipesById = new Map(
    computedRecipes.map((recipe) => [recipe.id, recipe]),
  );
  const sauceByRecipe = new Map(
    sauceCompatibilities.map((link) => [link.recette_id, link.sauce_id]),
  );
  const usedRecipeIds = new Set<string>();
  const items: GeneratedMealPlanItem[] = [];
  const dailyCalories = numberValue(profile.calories_goal);
  const dailyBudget = numberValue(profile.grocery_budget) / 7;

  for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
    const day = addDays(startDate, dayIndex);

    for (const slot of MEAL_SLOTS) {
      const targetCalories = dailyCalories * slot.calorieShare;
      const targetBudget = dailyBudget * slot.budgetShare;
      const candidates: Array<{
        recipe: ComputedRecipe;
        sauce: ComputedRecipe | null;
        ratio: number;
        totals: NutritionTotals;
        score: number;
      }> = [];

      for (const recipe of computedRecipes) {
        if (
          recipe.categorie !== slot.category ||
          !equipmentCompatible(recipe, profile)
        ) {
          continue;
        }

        const sauceId =
          recipe.categorie === "Plat" ? sauceByRecipe.get(recipe.id) : undefined;
        const sauce = sauceId ? recipesById.get(sauceId) ?? null : null;
        if (sauce && !equipmentCompatible(sauce, profile)) continue;

        for (let ratioStep = 5; ratioStep <= 15; ratioStep += 1) {
          const ratio = ratioStep / 10;
          const totals = addTotals(
            scaleTotals(recipe.totals, ratio),
            sauce?.totals,
          );
          const calorieError =
            targetCalories > 0
              ? Math.abs(totals.calories - targetCalories) / targetCalories
              : 0;
          const budgetError =
            targetBudget > 0
              ? Math.max(0, (totals.price - targetBudget) / targetBudget)
              : 0;

          candidates.push({
            recipe,
            sauce,
            ratio,
            totals,
            score: calorieError * 0.6 + budgetError * 0.4,
          });
        }
      }

      if (candidates.length === 0) continue;

      candidates.sort((a, b) => a.score - b.score);
      const bestScore = candidates[0].score;
      const tiedCandidates = candidates.filter(
        (candidate) => Math.abs(candidate.score - bestScore) < 0.000001,
      );
      const selected =
        tiedCandidates.find(
          (candidate) => !usedRecipeIds.has(candidate.recipe.id),
        ) ?? tiedCandidates[0];

      usedRecipeIds.add(selected.recipe.id);
      items.push({
        day,
        slot: slot.key,
        recipeId: selected.recipe.id,
        recipeName: selected.recipe.nom,
        sauceId: selected.sauce?.id ?? null,
        sauceName: selected.sauce?.nom ?? null,
        portionRatio: selected.ratio,
        price: round(selected.totals.price),
        calories: round(selected.totals.calories, 1),
        protein: round(selected.totals.protein, 1),
        carbs: round(selected.totals.carbs, 1),
        fat: round(selected.totals.fat, 1),
      });
    }
  }

  return items;
}