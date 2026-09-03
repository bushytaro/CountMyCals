import { useState } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUpdateProfile, useUpdateUserStores, useProfile, useStores } from "@/hooks/use-profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronRight, ChevronLeft, Check, ChefHat, Target, ShoppingBag, Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Validation Schemas
const goalsSchema = z.object({
  calories_goal: z.coerce.number().min(500, "Min 500 cals").max(10000, "Max 10000 cals"),
  protein_goal: z.coerce.number().min(0).max(500),
  carbs_goal: z.coerce.number().min(0).max(1000),
  fat_goal: z.coerce.number().min(0).max(500),
});

const equipmentSchema = z.object({
  has_oven: z.boolean().default(false),
  has_microwave: z.boolean().default(false),
  has_saucepan: z.boolean().default(false),
  has_pan: z.boolean().default(false),
  has_blender: z.boolean().default(false),
});

const storesSchema = z.object({
  storeIds: z.array(z.string()).min(1, "Select at least one store"),
});

const budgetSchema = z.object({
  grocery_budget: z.coerce.number().min(10, "Minimum 10"),
});

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const updateProfile = useUpdateProfile();
  const updateStores = useUpdateUserStores();
  const { data: availableStores, isLoading: storesLoading } = useStores();

  // Forms
  const goalsForm = useForm({ resolver: zodResolver(goalsSchema), defaultValues: { calories_goal: 2000, protein_goal: 150, carbs_goal: 200, fat_goal: 65 } });
  const equipmentForm = useForm({ resolver: zodResolver(equipmentSchema), defaultValues: { has_oven: true, has_microwave: true, has_saucepan: true, has_pan: true, has_blender: false } });
  const storesForm = useForm({ resolver: zodResolver(storesSchema), defaultValues: { storeIds: [] as string[] } });
  const budgetForm = useForm({ resolver: zodResolver(budgetSchema), defaultValues: { grocery_budget: 80 } });

  const handleNext = async (form: any, nextStep: number) => {
    const isValid = await form.trigger();
    if (isValid) setStep(nextStep);
  };

  const finishOnboarding = async () => {
    const isValid = await budgetForm.trigger();
    if (!isValid) return;

    try {
      const goals = goalsForm.getValues();
      const equipment = equipmentForm.getValues();
      const stores = storesForm.getValues().storeIds;
      const budget = budgetForm.getValues();

      await updateStores.mutateAsync(stores);
      await updateProfile.mutateAsync({
        ...goals,
        ...equipment,
        ...budget,
        onboarding_completed: true,
      });

      toast({ title: "Profile complete!", description: "Your notebook is ready." });
      setLocation("/dashboard");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  const steps = [
    { id: 1, title: "Goals", icon: Target, desc: "Your daily targets" },
    { id: 2, title: "Kitchen", icon: ChefHat, desc: "What tools do you have?" },
    { id: 3, title: "Stores", icon: ShoppingBag, desc: "Where you shop" },
    { id: 4, title: "Budget", icon: Wallet, desc: "Weekly limits" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Progress Bar */}
      <div className="w-full bg-card border-b border-border p-4 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          {steps.map((s, idx) => (
            <div key={s.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors duration-300
                  ${step > s.id ? "bg-primary text-primary-foreground" : 
                    step === s.id ? "bg-accent text-accent-foreground border-2 border-primary/20" : 
                    "bg-muted text-muted-foreground"}
                `}>
                  {step > s.id ? <Check className="w-5 h-5" /> : <s.icon className="w-5 h-5" />}
                </div>
                <span className="text-xs font-medium text-center hidden md:block">{s.title}</span>
              </div>
              {idx < steps.length - 1 && (
                <div className={`h-1 w-full mx-2 rounded-full transition-colors duration-300 ${step > s.id ? "bg-primary" : "bg-border"}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 max-w-2xl w-full mx-auto p-6 md:p-12 flex flex-col justify-center">
        <div className="bg-card rounded-3xl border border-border p-8 shadow-sm">
          {/* STEP 1: GOALS */}
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <h2 className="text-3xl font-serif text-foreground mb-2">Let's set your targets</h2>
              <p className="text-muted-foreground mb-8">What are your daily nutritional goals? You can adjust these later.</p>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-base text-foreground/80 flex justify-between">
                    <span>Calories (kcal)</span>
                    <span className="text-primary font-medium">{goalsForm.watch("calories_goal")}</span>
                  </Label>
                  <Input type="number" {...goalsForm.register("calories_goal")} className="h-14 text-lg rounded-xl bg-background" />
                  {goalsForm.formState.errors.calories_goal && <p className="text-sm text-destructive">{goalsForm.formState.errors.calories_goal.message?.toString()}</p>}
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-foreground/80">Protein (g)</Label>
                    <Input type="number" {...goalsForm.register("protein_goal")} className="h-12 rounded-xl bg-background" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-foreground/80">Carbs (g)</Label>
                    <Input type="number" {...goalsForm.register("carbs_goal")} className="h-12 rounded-xl bg-background" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-foreground/80">Fat (g)</Label>
                    <Input type="number" {...goalsForm.register("fat_goal")} className="h-12 rounded-xl bg-background" />
                  </div>
                </div>
              </div>
              
              <div className="mt-10 flex justify-end">
                <Button size="lg" className="rounded-xl px-8" onClick={() => handleNext(goalsForm, 2)}>
                  Next Step <ChevronRight className="ml-2 w-5 h-5" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: KITCHEN */}
          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <h2 className="text-3xl font-serif text-foreground mb-2">Your Kitchen Setup</h2>
              <p className="text-muted-foreground mb-8">We'll only suggest recipes you can actually make.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { id: "has_oven", label: "Oven" },
                  { id: "has_microwave", label: "Microwave" },
                  { id: "has_saucepan", label: "Saucepan" },
                  { id: "has_pan", label: "Frying Pan" },
                  { id: "has_blender", label: "Blender" },
                ].map((item) => {
                  const isChecked = equipmentForm.watch(item.id as keyof typeof equipmentSchema.shape);
                  return (
                    <label 
                      key={item.id}
                      className={`
                        flex items-center p-4 border rounded-2xl cursor-pointer transition-all duration-200
                        ${isChecked ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-background hover:bg-muted/50"}
                      `}
                    >
                      <div className={`
                        w-6 h-6 rounded-full border flex items-center justify-center mr-4 transition-colors
                        ${isChecked ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30 bg-card"}
                      `}>
                        {isChecked && <Check className="w-4 h-4" />}
                      </div>
                      <span className="font-medium text-foreground/90">{item.label}</span>
                      <input 
                        type="checkbox" 
                        className="hidden"
                        {...equipmentForm.register(item.id as keyof typeof equipmentSchema.shape)}
                      />
                    </label>
                  );
                })}
              </div>
              
              <div className="mt-10 flex justify-between">
                <Button variant="ghost" onClick={() => setStep(1)} className="rounded-xl">
                  <ChevronLeft className="mr-2 w-5 h-5" /> Back
                </Button>
                <Button size="lg" className="rounded-xl px-8" onClick={() => handleNext(equipmentForm, 3)}>
                  Next Step <ChevronRight className="ml-2 w-5 h-5" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: STORES */}
          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <h2 className="text-3xl font-serif text-foreground mb-2">Where do you shop?</h2>
              <p className="text-muted-foreground mb-8">This helps us estimate accurate prices.</p>
              
              {storesLoading ? (
                <div className="animate-pulse space-y-4">
                  {[1,2,3].map(i => <div key={i} className="h-16 bg-muted rounded-2xl" />)}
                </div>
              ) : (
                <div className="grid gap-4">
                  {availableStores?.map((store) => {
                    const currentStores = storesForm.watch("storeIds");
                    const isSelected = currentStores.includes(store.id);
                    return (
                      <label 
                        key={store.id}
                        className={`
                          flex items-center p-4 border rounded-2xl cursor-pointer transition-all duration-200
                          ${isSelected ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-background hover:bg-muted/50"}
                        `}
                      >
                        <div className={`
                          w-6 h-6 rounded-full border flex items-center justify-center mr-4 transition-colors
                          ${isSelected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30 bg-card"}
                        `}>
                          {isSelected && <Check className="w-4 h-4" />}
                        </div>
                        <span className="font-medium text-foreground/90 text-lg">{store.name}</span>
                        <input 
                          type="checkbox" 
                          className="hidden"
                          value={store.id}
                          {...storesForm.register("storeIds")}
                        />
                      </label>
                    );
                  })}
                  {storesForm.formState.errors.storeIds && (
                    <p className="text-sm text-destructive mt-2">{storesForm.formState.errors.storeIds.message?.toString()}</p>
                  )}
                </div>
              )}
              
              <div className="mt-10 flex justify-between">
                <Button variant="ghost" onClick={() => setStep(2)} className="rounded-xl">
                  <ChevronLeft className="mr-2 w-5 h-5" /> Back
                </Button>
                <Button size="lg" className="rounded-xl px-8" onClick={() => handleNext(storesForm, 4)}>
                  Next Step <ChevronRight className="ml-2 w-5 h-5" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 4: BUDGET */}
          {step === 4 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <h2 className="text-3xl font-serif text-foreground mb-2">Weekly Grocery Budget</h2>
              <p className="text-muted-foreground mb-8">Let's make sure our plans match your wallet.</p>
              
              <div className="space-y-6">
                <div className="space-y-4">
                  <Label className="text-base text-foreground/80 flex justify-between items-center">
                    <span>Amount per week</span>
                    <div className="flex items-center bg-muted px-4 py-2 rounded-xl text-lg font-medium text-foreground">
                      € {budgetForm.watch("grocery_budget")}
                    </div>
                  </Label>
                  <div className="relative pt-6 pb-2">
                    <input 
                      type="range" 
                      min="20" max="300" step="5"
                      className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer accent-primary"
                      {...budgetForm.register("grocery_budget")}
                    />
                  </div>
                  {budgetForm.formState.errors.grocery_budget && (
                    <p className="text-sm text-destructive">{budgetForm.formState.errors.grocery_budget.message?.toString()}</p>
                  )}
                </div>
              </div>
              
              <div className="mt-12 flex justify-between">
                <Button variant="ghost" onClick={() => setStep(3)} className="rounded-xl" disabled={updateProfile.isPending}>
                  <ChevronLeft className="mr-2 w-5 h-5" /> Back
                </Button>
                <Button 
                  size="lg" 
                  className="rounded-xl px-8 shadow-sm" 
                  onClick={finishOnboarding}
                  disabled={updateProfile.isPending || updateStores.isPending}
                >
                  {updateProfile.isPending ? "Saving..." : "Open Notebook"} 
                  {!updateProfile.isPending && <Check className="ml-2 w-5 h-5" />}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
