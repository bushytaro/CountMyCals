import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
  Redirect,
} from 'wouter';
import { BookOpen } from 'lucide-react';
import { AuthProvider, useAuth } from '@/hooks/use-auth';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useProfile } from '@/hooks/use-profile';

// Pages
import AuthPage from '@/pages/auth';
import OnboardingPage from '@/pages/onboarding';
import DashboardPage from '@/pages/dashboard';
import PlanPage from '@/pages/plan';
import RecipesPage from '@/pages/recipes';
import ProfilePage from '@/pages/profile';
import { Shell } from '@/components/layout/shell';

const queryClient = new QueryClient();

function ProtectedRoute({ 
  component: Component, 
  requireOnboarding = true 
}: { 
  component: React.ComponentType, 
  requireOnboarding?: boolean 
}) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { data: profile, isLoading: isProfileLoading } = useProfile();

  if (isAuthLoading || (user && isProfileLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/20 border-2 border-primary/40" />
          <p className="text-muted-foreground font-serif text-lg">Opening your notebook...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/" />;
  }

  const isOnboardingCompleted = !!profile;

  if (requireOnboarding && !isOnboardingCompleted) {
    return <Redirect to="/onboarding" />;
  }

  if (!requireOnboarding && isOnboardingCompleted) {
    return <Redirect to="/dashboard" />;
  }

  return (
    <Shell>
      <Component />
    </Shell>
  );
}

function SetupRequired() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md w-full bg-card rounded-2xl shadow-sm border border-border p-8 text-center space-y-6">
        <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
          <BookOpen className="w-8 h-8 text-accent-foreground" />
        </div>
        <h1 className="text-3xl font-serif font-medium text-foreground">Kitchen Setup Required</h1>
        <p className="text-muted-foreground text-lg leading-relaxed">
          CountMyCals needs its ingredients. Please connect your Supabase project with the required environment variables:
        </p>
        <div className="bg-muted rounded-xl p-4 text-left font-mono text-sm text-muted-foreground space-y-2">
          <div>VITE_SUPABASE_URL</div>
          <div>VITE_SUPABASE_ANON_KEY</div>
        </div>
      </div>
    </div>
  );
}

function AuthConnectionError() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md w-full bg-card rounded-2xl shadow-sm border border-border p-8 text-center space-y-5">
        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
          <BookOpen className="w-8 h-8 text-destructive" />
        </div>
        <h1 className="text-2xl font-serif font-medium text-foreground">
          Connexion impossible
        </h1>
        <p className="text-muted-foreground leading-relaxed">
          Supabase ne répond pas pour le moment. Vérifie ta connexion puis recharge la page.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="w-full rounded-xl bg-primary px-4 py-3 font-medium text-primary-foreground hover:opacity-90"
        >
          Recharger
        </button>
      </div>
    </div>
  );
}

function ProfileConnectionError() {
  const { signOut } = useAuth();
  const [, setLocation] = useLocation();

  const returnToSignIn = async () => {
    try {
      await signOut();
    } finally {
      setLocation("/");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md w-full bg-card rounded-2xl shadow-sm border border-border p-8 text-center space-y-5">
        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
          <BookOpen className="w-8 h-8 text-destructive" />
        </div>
        <h1 className="text-2xl font-serif font-medium text-foreground">
          Profil inaccessible
        </h1>
        <p className="text-muted-foreground leading-relaxed">
          CountMyCals n’arrive pas à lire ton profil Supabase. Vérifie la table
          profils_utilisateurs et ses règles RLS.
        </p>
        <button
          type="button"
          onClick={returnToSignIn}
          className="w-full rounded-xl bg-primary px-4 py-3 font-medium text-primary-foreground hover:opacity-90"
        >
          Retour à la connexion
        </button>
      </div>
    </div>
  );
}

function Router() {
  const { user, isLoading, authError } = useAuth();
  const {
    data: profile,
    isLoading: isProfileLoading,
    isError: isProfileError,
  } = useProfile();

  if (!isSupabaseConfigured()) {
    return <SetupRequired />;
  }

  if (isLoading || (user && isProfileLoading)) {
     return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/20 border-2 border-primary/40" />
          <p className="text-muted-foreground font-serif text-lg">Opening your notebook...</p>
        </div>
      </div>
    );
  }

  if (authError && !user) {
    return <AuthConnectionError />;
  }

  if (user && isProfileError) {
    return <ProfileConnectionError />;
  }

  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/">
          {user ? (
            <Redirect to={profile ? "/dashboard" : "/onboarding"} />
          ) : (
            <AuthPage />
          )}
        </Route>
        <Route path="/onboarding">
          <ProtectedRoute component={OnboardingPage} requireOnboarding={false} />
        </Route>
        
        {/* Protected Routes */}
        <Route path="/dashboard">
          <ProtectedRoute component={DashboardPage} />
        </Route>
        <Route path="/plan">
          <ProtectedRoute component={PlanPage} />
        </Route>
        <Route path="/recettes">
          <ProtectedRoute component={RecipesPage} />
        </Route>
        <Route path="/profile">
          <ProtectedRoute component={ProfilePage} />
        </Route>

        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
