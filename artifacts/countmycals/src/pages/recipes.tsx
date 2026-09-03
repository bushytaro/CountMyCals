import { useState } from "react";
import { useRecipes } from "@/hooks/use-recipes";
import { Input } from "@/components/ui/input";
import { Search, Clock, ChefHat } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function RecipesPage() {
  const { data: recipes, isLoading } = useRecipes();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = Array.from(new Set(recipes?.map(r => r.category) || [])).sort();

  const filteredRecipes = recipes?.filter(recipe => {
    const matchesSearch = recipe.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory ? recipe.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="space-y-4">
        <h1 className="text-4xl font-serif font-medium text-foreground tracking-tight">
          Your Recipe Collection
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          Meals tailored to your kitchen equipment and budget.
        </p>
      </header>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input 
            placeholder="Search recipes..." 
            className="pl-12 h-14 rounded-2xl bg-card border-border shadow-sm text-lg"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {!isLoading && categories.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
              selectedCategory === null 
                ? "bg-foreground text-background" 
                : "bg-card text-muted-foreground border border-border hover:bg-muted"
            }`}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                selectedCategory === cat 
                  ? "bg-foreground text-background" 
                  : "bg-card text-muted-foreground border border-border hover:bg-muted"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-48 bg-muted rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : filteredRecipes?.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-3xl border border-border shadow-sm">
          <ChefHat className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-xl font-serif text-foreground mb-2">No recipes found</h3>
          <p className="text-muted-foreground">Try adjusting your search or category filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecipes?.map((recipe) => (
            <Card key={recipe.id} className="rounded-3xl border-border bg-card shadow-sm hover:shadow-md transition-shadow group cursor-pointer overflow-hidden flex flex-col">
              <div className="h-32 bg-secondary/10 flex items-center justify-center p-6 relative">
                 {/* Decorative abstract shape instead of image */}
                 <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/40 via-transparent to-transparent"></div>
                 <ChefHat className="w-12 h-12 text-primary/40 group-hover:scale-110 transition-transform duration-500" />
                 <div className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-foreground border border-border/50">
                   {recipe.category}
                 </div>
              </div>
              <CardContent className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-serif font-medium text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                    {recipe.name}
                  </h3>
                </div>
                <div className="flex items-center text-sm text-muted-foreground mt-4 gap-4">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    <span>{recipe.preparation_time} min</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
