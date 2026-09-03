import { useEffect } from "react";
import { useProfile, useUpdateProfile, useStores, useUserStores, useUpdateUserStores } from "@/hooks/use-profile";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Check, Loader2 } from "lucide-react";

const profileSchema = z.object({
  calories_goal: z.coerce.number().min(500).max(10000),
  protein_goal: z.coerce.number().min(0).max(500),
  carbs_goal: z.coerce.number().min(0).max(1000),
  fat_goal: z.coerce.number().min(0).max(500),
  grocery_budget: z.coerce.number().min(10),
  has_oven: z.boolean(),
  has_microwave: z.boolean(),
  has_saucepan: z.boolean(),
  has_pan: z.boolean(),
  has_blender: z.boolean(),
});

const storesSchema = z.object({
  storeIds: z.array(z.string()),
});

export default function ProfilePage() {
  const { data: profile, isLoading: isProfileLoading } = useProfile();
  const { data: userStoreIds, isLoading: isUserStoresLoading } = useUserStores();
  const { data: allStores } = useStores();
  
  const updateProfile = useUpdateProfile();
  const updateStores = useUpdateUserStores();
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      calories_goal: 2000,
      protein_goal: 150,
      carbs_goal: 200,
      fat_goal: 65,
      grocery_budget: 80,
      has_oven: false,
      has_microwave: false,
      has_saucepan: false,
      has_pan: false,
      has_blender: false,
    }
  });

  const storesForm = useForm({
    resolver: zodResolver(storesSchema),
    defaultValues: { storeIds: [] as string[] }
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        calories_goal: profile.calories_goal || 2000,
        protein_goal: profile.protein_goal || 150,
        carbs_goal: profile.carbs_goal || 200,
        fat_goal: profile.fat_goal || 65,
        grocery_budget: profile.grocery_budget || 80,
        has_oven: profile.has_oven,
        has_microwave: profile.has_microwave,
        has_saucepan: profile.has_saucepan,
        has_pan: profile.has_pan,
        has_blender: profile.has_blender,
      });
    }
  }, [profile, form]);

  useEffect(() => {
    if (userStoreIds) {
      storesForm.reset({ storeIds: userStoreIds });
    }
  }, [userStoreIds, storesForm]);

  const onSubmit = async (data: any) => {
    try {
      await updateProfile.mutateAsync(data);
      await updateStores.mutateAsync(storesForm.getValues().storeIds);
      toast({ title: "Profile updated", description: "Your notebook has been updated." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  const isLoading = isProfileLoading || isUserStoresLoading;

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-10 bg-muted w-1/4 rounded-lg" />
        <div className="h-[400px] bg-muted rounded-3xl" />
      </div>
    );
  }

  const isSaving = updateProfile.isPending || updateStores.isPending;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header>
        <h1 className="text-4xl font-serif font-medium text-foreground tracking-tight mb-2">
          Your Profile
        </h1>
        <p className="text-lg text-muted-foreground">
          Update your targets, kitchen equipment, and shopping preferences.
        </p>
      </header>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          <div className="space-y-8">
            <Card className="rounded-3xl border-border bg-card shadow-sm">
              <CardHeader>
                <CardTitle className="font-serif text-xl">Daily Targets</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Calories (kcal)</Label>
                  <Input type="number" {...form.register("calories_goal")} className="h-12 rounded-xl bg-background" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Protein (g)</Label>
                    <Input type="number" {...form.register("protein_goal")} className="h-12 rounded-xl bg-background" />
                  </div>
                  <div className="space-y-2">
                    <Label>Carbs (g)</Label>
                    <Input type="number" {...form.register("carbs_goal")} className="h-12 rounded-xl bg-background" />
                  </div>
                  <div className="space-y-2">
                    <Label>Fat (g)</Label>
                    <Input type="number" {...form.register("fat_goal")} className="h-12 rounded-xl bg-background" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-border bg-card shadow-sm">
              <CardHeader>
                <CardTitle className="font-serif text-xl">Weekly Budget</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <span className="text-xl font-medium text-muted-foreground">€</span>
                    <Input type="number" {...form.register("grocery_budget")} className="h-14 text-lg rounded-xl bg-background" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            <Card className="rounded-3xl border-border bg-card shadow-sm">
              <CardHeader>
                <CardTitle className="font-serif text-xl">Kitchen Equipment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { id: "has_oven", label: "Oven" },
                    { id: "has_microwave", label: "Microwave" },
                    { id: "has_saucepan", label: "Saucepan" },
                    { id: "has_pan", label: "Frying Pan" },
                    { id: "has_blender", label: "Blender" },
                  ].map((item) => {
                    const isChecked = form.watch(item.id as any);
                    return (
                      <label 
                        key={item.id}
                        className={`flex items-center p-3 border rounded-xl cursor-pointer transition-colors
                          ${isChecked ? "border-primary bg-primary/5" : "border-border bg-background"}
                        `}
                      >
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3
                          ${isChecked ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30"}
                        `}>
                          {isChecked && <Check className="w-3 h-3" />}
                        </div>
                        <span className="text-sm font-medium">{item.label}</span>
                        <input type="checkbox" className="hidden" {...form.register(item.id as any)} />
                      </label>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-border bg-card shadow-sm">
              <CardHeader>
                <CardTitle className="font-serif text-xl">Preferred Stores</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3">
                  {allStores?.map((store) => {
                    const currentStores = storesForm.watch("storeIds");
                    const isSelected = currentStores.includes(store.id);
                    return (
                      <label 
                        key={store.id}
                        className={`flex items-center p-4 border rounded-xl cursor-pointer transition-colors
                          ${isSelected ? "border-primary bg-primary/5" : "border-border bg-background"}
                        `}
                      >
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3
                          ${isSelected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30"}
                        `}>
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                        <span className="font-medium">{store.name}</span>
                        <input type="checkbox" className="hidden" value={store.id} {...storesForm.register("storeIds")} />
                      </label>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button 
            type="submit" 
            size="lg" 
            className="rounded-xl px-10 h-14 text-base shadow-sm"
            disabled={isSaving}
          >
            {isSaving ? (
              <><Loader2 className="mr-2 w-5 h-5 animate-spin" /> Saving...</>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
