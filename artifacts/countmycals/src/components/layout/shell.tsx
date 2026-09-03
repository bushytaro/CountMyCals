import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, Home, Utensils, User, LogOut, BookOpen, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export function Shell({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [location] = useLocation();
  const { signOut } = useAuth();

  const navItems = [
    { href: "/dashboard", label: "Overview", icon: Home },
    { href: "/recettes", label: "Recipes", icon: Utensils },
    { href: "/profile", label: "My Profile", icon: User },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row bg-background">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card sticky top-0 z-20">
        <div className="flex items-center gap-2 text-primary">
          <BookOpen className="w-6 h-6" />
          <span className="font-serif font-semibold text-lg tracking-tight">CountMyCals</span>
        </div>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <Menu className="w-6 h-6" />
        </Button>
      </div>

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-card border-r border-border flex flex-col transition-transform duration-300 ease-in-out
        md:static md:translate-x-0
        ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="hidden md:flex items-center gap-3 p-6 text-primary">
          <div className="bg-primary/10 p-2 rounded-xl">
            <BookOpen className="w-6 h-6" />
          </div>
          <span className="font-serif font-semibold text-xl tracking-tight text-foreground">CountMyCals</span>
        </div>

        <nav className="flex-1 px-4 py-6 md:py-2 space-y-1.5">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                  ${isActive 
                    ? "bg-primary text-primary-foreground font-medium shadow-sm shadow-primary/20" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }
                `}
              >
                <item.icon className={`w-5 h-5 ${isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary"}`} />
                <span>{item.label}</span>
                {isActive && <ChevronRight className="w-4 h-4 ml-auto opacity-70" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <button
            onClick={() => signOut()}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-20 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto w-full relative">
        <div className="max-w-4xl mx-auto p-4 md:p-8 lg:p-12 pb-24">
          {children}
        </div>
      </main>
    </div>
  );
}
