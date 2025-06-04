import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface GoogleAuthProps {
  onSuccess: (token: string, user: any) => void;
}

export default function GoogleAuth({ onSuccess }: GoogleAuthProps) {
  const { toast } = useToast();

  const handleGoogleLogin = async () => {
    try {
      // Load Google Sign-In API
      if (!window.google) {
        toast({
          title: "Google Sign-In not available",
          description: "Please provide your Google Client ID to enable Google authentication.",
          variant: "destructive",
        });
        return;
      }

      // Initialize Google Sign-In
      await new Promise<void>((resolve) => {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: async (response: any) => {
            try {
              const authResponse = await fetch('/api/auth/google', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ idToken: response.credential }),
              });

              if (!authResponse.ok) {
                const error = await authResponse.json();
                throw new Error(error.message);
              }

              const { user, token } = await authResponse.json();
              localStorage.setItem('authToken', token);
              onSuccess(token, user);
            } catch (error: any) {
              toast({
                title: "Authentication failed",
                description: error.message || "Failed to authenticate with Google",
                variant: "destructive",
              });
            }
          },
        });
        resolve();
      });

      // Trigger the sign-in flow
      window.google.accounts.id.prompt();
    } catch (error: any) {
      toast({
        title: "Google Sign-In Error",
        description: "Please provide your Google Client ID to enable authentication.",
        variant: "destructive",
      });
    }
  };

  return (
    <Button
      onClick={handleGoogleLogin}
      variant="outline"
      className="w-full bg-white hover:bg-gray-50 text-gray-900 border-gray-300 flex items-center gap-3"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
      Continue with Google
    </Button>
  );
}

declare global {
  interface Window {
    google: any;
  }
}