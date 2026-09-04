import { useMealPlan, useGenerateMealPlan } from "@/hooks/use-meal-plan";
import { useProfile } from "@/hooks/use-profile";
import { Card, CardContent } from "@/components/ui/card";
import { MEAL_SLOTS } from "@/lib/meal-plan";
import { Loader2, Sparkles, AlertCircle, Flame, Coins, UtensilsCrossed } from "lucide-react";
import { format, parseISO, addDays } from "date-fns";
import { fr } from "date-fns/locale";

export default function PlanPage() {
  const {
    data: plan,
    isLoading: isPlanLoading,
    isError: isPlanError,
    error: planError,
    refetch: refetchPlan,
  } = useMealPlan();
  const generatePlan = useGenerateMealPlan();
  const { data: profile } = useProfile();

  if (isPlanLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4 animate-in fade-in">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground font-serif text-lg">Chargement de ton carnet...</p>
      </div>
    );
  }

  if (isPlanError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
        <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center">
          <AlertCircle className="w-10 h-10 text-destructive" />
        </div>
        <div className="space-y-2 max-w-md">
          <h2 className="text-3xl font-serif text-foreground">
            Plan inaccessible
          </h2>
          <p className="text-muted-foreground">
            {planError instanceof Error
              ? planError.message
              : "Impossible de charger ton plan pour le moment."}
          </p>
        </div>
        <button
          type="button"
          data-testid="button-retry-plan"
          onClick={() => void refetchPlan()}
          className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center shadow-inner">
          <Sparkles className="w-12 h-12 text-primary" />
        </div>
        <div className="space-y-3 max-w-md">
          <h2 className="text-3xl md:text-4xl font-serif text-foreground">Ton plan de la semaine</h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Génère un menu sur 7 jours parfaitement adapté à tes objectifs caloriques, ton budget et ton équipement de cuisine.
          </p>
        </div>
        
        {generatePlan.error && (
          <div className="p-4 bg-destructive/10 text-destructive rounded-xl text-sm max-w-md flex items-start gap-3 text-left">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{generatePlan.error instanceof Error ? generatePlan.error.message : "Une erreur est survenue lors de la génération."}</span>
          </div>
        )}

        <button
          data-testid="button-generate-plan"
          onClick={() => generatePlan.mutate()}
          disabled={generatePlan.isPending}
          className="mt-4 px-8 py-4 rounded-xl bg-primary text-primary-foreground font-medium text-lg flex items-center gap-3 hover:opacity-90 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 transition-all shadow-md cursor-pointer"
        >
          {generatePlan.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
          {generatePlan.isPending ? "Génération en cours..." : "Générer mon plan"}
        </button>
      </div>
    );
  }

  const startDate = parseISO(plan.startDate);
  const daysArray = Array.from({ length: 7 }).map((_, i) => format(addDays(startDate, i), "yyyy-MM-dd"));

  const itemsByDay = plan.items.reduce((acc, item) => {
    if (!acc[item.day]) acc[item.day] = [];
    acc[item.day].push(item);
    return acc;
  }, {} as Record<string, typeof plan.items>);

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-serif font-medium text-foreground tracking-tight">
            Plan de la semaine
          </h1>
          <p className="text-lg text-muted-foreground">
            Aperçu de tes repas pour les 7 prochains jours.
          </p>
        </div>
        
        <div className="flex flex-col md:items-end gap-2">
          <button
            data-testid="button-regenerate-plan"
            onClick={() => generatePlan.mutate()}
            disabled={generatePlan.isPending}
            className="px-5 py-2.5 rounded-xl bg-secondary/15 text-secondary-foreground font-medium flex items-center justify-center gap-2 hover:bg-secondary/25 disabled:opacity-50 transition-all cursor-pointer"
          >
            {generatePlan.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {generatePlan.isPending ? "Génération..." : "Régénérer le plan"}
          </button>
          {generatePlan.error && (
            <span className="text-xs text-destructive max-w-xs text-right">
              {generatePlan.error instanceof Error ? generatePlan.error.message : "Erreur de génération"}
            </span>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="rounded-3xl border-border bg-card shadow-sm overflow-hidden relative group hover:shadow-md transition-shadow duration-500">
          <div className="absolute -right-4 -top-4 p-8 opacity-[0.03] group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-700">
            <Flame className="w-40 h-40" />
          </div>
          <CardContent className="p-6 md:p-8 flex items-center gap-6">
            <div className="w-16 h-16 shrink-0 rounded-2xl bg-accent/30 border-2 border-accent/20 flex items-center justify-center text-accent-foreground shadow-inner">
              <Flame className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Moyenne quotidienne</h3>
              <div className="flex items-baseline gap-2">
                <span data-testid="status-average-calories" className="text-4xl font-serif text-foreground">{plan.averageDailyCalories}</span>
                <span className="text-base text-muted-foreground">/ {profile?.calories_goal} kcal</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border bg-card shadow-sm overflow-hidden relative group hover:shadow-md transition-shadow duration-500">
          <div className="absolute -right-4 -top-4 p-8 opacity-[0.03] group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700">
            <Coins className="w-40 h-40" />
          </div>
          <CardContent className="p-6 md:p-8 flex items-center gap-6">
            <div className="w-16 h-16 shrink-0 rounded-2xl bg-secondary/20 border-2 border-secondary/10 flex items-center justify-center text-secondary-foreground shadow-inner">
              <Coins className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Budget hebdomadaire</h3>
              <div className="flex items-baseline gap-2">
                <span data-testid="status-weekly-price" className="text-4xl font-serif text-foreground">€{plan.weeklyPrice}</span>
                <span className="text-base text-muted-foreground">/ €{profile?.grocery_budget}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-12">
        {daysArray.map((dayStr) => {
          const date = parseISO(dayStr);
          const dayItems = itemsByDay[dayStr] || [];
          
          return (
            <div key={dayStr} className="relative" data-testid={`day-plan-${dayStr}`}>
              <div className="md:sticky md:top-20 z-10 bg-background/95 backdrop-blur-md py-4 mb-6 border-b border-border/50 flex items-center gap-4">
                 <div className="w-12 h-12 shrink-0 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-serif font-bold text-xl shadow-sm">
                   {format(date, "d")}
                 </div>
                 <div>
                   <h3 className="font-serif text-2xl capitalize text-foreground leading-none">{format(date, "EEEE", { locale: fr })}</h3>
                   <p className="text-sm text-muted-foreground capitalize mt-1">{format(date, "MMMM yyyy", { locale: fr })}</p>
                 </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {MEAL_SLOTS.map(slot => {
                  const item = dayItems.find(i => i.slot === slot.key);
                  
                  return (
                    <Card key={slot.key} data-testid={`card-meal-${dayStr}-${slot.key}`} className="rounded-2xl border-border shadow-sm overflow-hidden flex flex-col transition-colors hover:border-primary/20">
                      <div className="bg-muted/30 px-5 py-3 border-b border-border flex items-center justify-between">
                        <span className="font-medium text-foreground">{slot.label}</span>
                        {item && (
                          <span className="text-xs font-medium text-muted-foreground bg-background border border-border px-2.5 py-1 rounded-lg shadow-sm">
                            {item.calories} kcal
                          </span>
                        )}
                      </div>
                      <CardContent className="p-5 flex-1 flex flex-col justify-center bg-card">
                        {!item ? (
                          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                              <UtensilsCrossed className="w-6 h-6 opacity-40" />
                            </div>
                            <span data-testid={`status-empty-${dayStr}-${slot.key}`} className="text-sm max-w-[220px]">Aucune recette compatible avec ton équipement.</span>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div>
                              <h4 data-testid={`text-recipe-${dayStr}-${slot.key}`} className="font-serif text-xl text-foreground leading-tight group-hover:text-primary transition-colors">{item.recipeName}</h4>
                              {item.sauceName && (
                                <p className="text-sm text-secondary-foreground font-medium mt-1">
                                  + Sauce {item.sauceName.toLowerCase()}
                                </p>
                              )}
                            </div>
                            
                            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border/60">
                              <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
                                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-rose-400" />{item.protein}g P</span>
                                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" />{item.carbs}g G</span>
                                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-sky-400" />{item.fat}g L</span>
                              </div>
                              
                              <div className="flex items-center gap-3 text-sm">
                                {item.portionRatio !== 1 && (
                                  <span className="px-2.5 py-1 rounded-lg bg-accent/20 border border-accent/30 text-accent-foreground text-xs font-medium shadow-sm">
                                    Portion {item.portionRatio}x
                                  </span>
                                )}
                                <span data-testid={`text-price-${dayStr}-${slot.key}`} className="font-serif font-medium text-foreground bg-secondary/10 px-2.5 py-1 rounded-lg border border-secondary/20 shadow-sm">
                                  €{item.price}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
