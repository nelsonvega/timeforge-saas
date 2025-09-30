import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Login() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 rounded-xl bg-primary flex items-center justify-center mb-4 shadow-lg">
            <Clock className="h-9 w-9 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold">TimeTrack</h1>
          <p className="text-muted-foreground mt-2">
            Professional time tracking for modern teams
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <CardDescription>Sign in with your Replit account to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleLogin} 
              className="w-full" 
              size="lg" 
              data-testid="button-login"
            >
              Sign in with Replit
            </Button>
            
            <p className="text-center text-sm text-muted-foreground mt-6">
              This will redirect you to Replit's secure authentication page. You can sign in with Google, GitHub, or other supported providers.
            </p>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-8">
          By signing in, you agree to our{" "}
          <button className="underline hover:text-foreground">Terms of Service</button>{" "}
          and{" "}
          <button className="underline hover:text-foreground">Privacy Policy</button>
        </p>
      </div>
    </div>
  );
}
