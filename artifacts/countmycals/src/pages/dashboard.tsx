import { useProfile, useStores, useUserStores } from "@/hooks/use-profile";
import { useMealPlan, useGenerateMealPlan } from "@/hooks/use-meal-plan";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Flame, Beef, Wheat, Droplets, ArrowRight, ShoppingBag, ChefHat, Check, Sparkles, Loader2, AlertCircle } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function DashboardPage() {
  const { data: profile, isLoading } = useProfile();
  const { data: stores, isLoading: areStoresLoading } = useStores();
  const { data: userStoreIds, isLoading: areUserStoresLoading } = useUserStores();
  const { data: plan, isLoading: isPlanLoading } = useMealPlan();
  const generatePlan = useGenerateMealPlan();
  const [, setLocation] = useLocation();

  const handleGeneratePlan = async () => {
    try {
      await generatePlan.mutateAsync();
      setLocation("/plan");
    } catch (error) {
      // Intentionally swallowed here; UI displays generatePlan.error
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-10 bg-muted w-1/3 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 bg-muted rounded-3xl" />
          <div className="h-64 bg-muted rounded-3xl" />
        </div>
      </div>
    );
  }

  const selectedStoreNames = stores
    ?.filter((store) => userStoreIds?.includes(store.id))
    .map((store) => store.name) ?? [];

  const equipment = [
    ["Four", profile?.has_oven],
    ["Micro-onde", profile?.has_microwave],
    ["Casserole", profile?.has_saucepan],
    ["Poêle", profile?.has_pan],
    ["Mixeur", profile?.has_blender],
  ] as const;

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <header className="space-y-2">
        <h1 className="text-4xl font-serif font-medium text-foreground tracking-tight">
          Today's Overview
        </h1>
        <p className="text-lg text-muted-foreground">
          Here's how your daily intake is shaping up.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Calorie Card */}
        <div className="lg:col-span-7">
          <Card className="rounded-3xl border-border bg-card shadow-sm h-full overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Flame className="w-48 h-48" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl font-serif flex items-center gap-2 text-foreground/80">
                <Target className="w-5 h-5 text-primary" />
                Energy Balance
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-center gap-8 justify-between">
                <div className="relative w-48 h-48 flex items-center justify-center rounded-full bg-accent/30 border-8 border-accent">
                  <div className="flex flex-col items-center justify-center text-center">
                    <span className="text-4xl font-serif text-foreground">{profile?.calories_goal}</span>
                    <span className="text-sm text-muted-foreground mt-1">kcal / jour</span>
                  </div>
                </div>
                
                <div className="flex-1 w-full space-y-6">
                  <div className="bg-secondary/10 p-4 rounded-2xl">
                    <h4 className="text-sm font-medium text-secondary-foreground mb-1">Objectif quotidien</h4>
                    <p className="text-3xl font-serif text-secondary-foreground">
                      {profile?.calories_goal} <span className="text-base font-sans text-secondary-foreground/70">kcal</span>
                    </p>
                  </div>
                  <Link href="/profile" className="inline-flex items-center text-primary font-medium hover:underline underline-offset-4 group">
                    Modifier mes objectifs
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Macros */}
        <div className="lg:col-span-5 space-y-6">
            <MacroCard 
            title="Protein" 
            icon={Beef} 
              current={profile?.protein_goal || 0} 
            total={profile?.protein_goal || 0} 
            colorClass="bg-rose-500" 
            bgClass="bg-rose-500/10"
            textClass="text-rose-600"
          />
          <MacroCard 
            title="Carbs" 
            icon={Wheat} 
              current={profile?.carbs_goal || 0} 
            total={profile?.carbs_goal || 0} 
            colorClass="bg-amber-500" 
            bgClass="bg-amber-500/10"
            textClass="text-amber-600 dark:text-amber-500"
          />
          <MacroCard 
            title="Fat" 
            icon={Droplets} 
              current={profile?.fat_goal || 0} 
            total={profile?.fat_goal || 0} 
            colorClass="bg-sky-500" 
            bgClass="bg-sky-500/10"
            textClass="text-sky-600 dark:text-sky-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="rounded-3xl border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="font-serif text-xl flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-primary" />
              Mes magasins
            </CardTitle>
          </CardHeader>
          <CardContent>
            {areStoresLoading || areUserStoresLoading ? (
              <div className="h-10 bg-muted rounded-xl animate-pulse" />
            ) : selectedStoreNames.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {selectedStoreNames.map((name) => (
                  <span key={name} className="px-3 py-2 rounded-full bg-secondary/15 text-secondary-foreground text-sm font-medium">
                    {name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Aucun magasin sélectionné.</p>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="font-serif text-xl flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-primary" />
              Mon équipement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {equipment.filter(([, available]) => available).map(([name]) => (
                <span key={name} className="px-3 py-2 rounded-full bg-accent/35 text-accent-foreground text-sm font-medium inline-flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  {name}
                </span>
              ))}
              {equipment.every(([, available]) => !available) && (
                <p className="text-muted-foreground">Aucun équipement sélectionné.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Weekly Plan Action */}
      <div className="mt-8">
        <Card className="bg-accent/10 border-accent/20 rounded-3xl relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-1/4 translate-y-1/4">
            <Sparkles className="w-64 h-64" />
          </div>
          <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            <div className="space-y-3">
              <h3 className="text-2xl font-serif text-foreground">Mon plan de la semaine</h3>
              <p className="text-muted-foreground text-lg max-w-xl leading-relaxed">
                {plan
                  ? `Ton plan est prêt. Suis ton programme pour respecter ton objectif de ${profile?.calories_goal} kcal.`
                  : `Génère tes repas pour la semaine en respectant tes calories et ton budget de €${profile?.grocery_budget}.`}
              </p>
              {generatePlan.error && (
                <div className="p-3 bg-destructive/10 text-destructive rounded-xl text-sm max-w-md flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{generatePlan.error instanceof Error ? generatePlan.error.message : "Une erreur est survenue."}</span>
                </div>
              )}
            </div>
            <div className="shrink-0 w-full md:w-auto">
              {plan ? (
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href="/plan" className="w-full md:w-auto flex justify-center px-6 py-3.5 bg-primary text-primary-foreground rounded-xl font-medium shadow-sm hover:opacity-90 hover:scale-105 active:scale-95 transition-all items-center gap-2" data-testid="link-view-plan">
                    Voir mon plan
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                  <button
                    data-testid="button-regenerate-plan-dashboard"
                    onClick={handleGeneratePlan}
                    disabled={generatePlan.isPending}
                    className="w-full md:w-auto flex justify-center px-6 py-3.5 bg-background text-foreground border border-border rounded-xl font-medium shadow-sm hover:bg-muted active:scale-95 disabled:opacity-50 transition-all items-center gap-2 cursor-pointer"
                  >
                    {generatePlan.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                    {generatePlan.isPending ? "Génération..." : "Régénérer"}
                  </button>
                </div>
              ) : (
                <button
                  data-testid="button-generate-plan"
                  onClick={handleGeneratePlan}
                  disabled={generatePlan.isPending || isPlanLoading}
                  className="w-full md:w-auto flex justify-center px-6 py-3.5 bg-primary text-primary-foreground rounded-xl font-medium shadow-sm hover:opacity-90 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 transition-all items-center gap-2 cursor-pointer"
                >
                  {generatePlan.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                  {generatePlan.isPending ? "Génération..." : "Générer mon plan de la semaine"}
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MacroCard({ 
  title, icon: Icon, current, total, colorClass, bgClass, textClass 
}: { 
  title: string, icon: any, current: number, total: number, colorClass: string, bgClass: string, textClass: string 
}) {
  const percent = total > 0 ? Math.min(100, (current / total) * 100) : 0;
  
  return (
    <Card className="rounded-2xl border-border bg-card shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bgClass} ${textClass}`}>
              <Icon className="w-5 h-5" />
            </div>
            <h3 className="font-medium text-foreground">{title}</h3>
          </div>
          <div className="text-right">
            <span className="text-lg font-medium text-foreground">{current}g</span>
            <span className="text-sm text-muted-foreground"> / {total}g</span>
          </div>
        </div>
        <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full ${colorClass} transition-all duration-1000 ease-out`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
