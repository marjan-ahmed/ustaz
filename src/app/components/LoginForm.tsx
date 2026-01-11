"use client";

import { useState } from "react";
import { createClient } from "@/lib/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error.message || "Failed to sign in. Please check your credentials.");
        return;
      }

      // Successful login - redirect to dashboard
      toast.success("Login successful!");
      router.push("/dashboard");
      router.refresh(); // Refresh to update the UI
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.message || "An unexpected error occurred during login.");
    } finally {
      setIsLoading(false);
    }
  };

  // Skeleton loading state
  const [isLoaded] = useState(false);

  if (!isLoaded) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-3/4 mx-auto mb-6" /> {/* Title skeleton */}
        <Skeleton className="h-6 w-1/4" /> {/* Label skeleton */}
        <Skeleton className="h-10 w-full" /> {/* Input skeleton */}
        <Skeleton className="h-6 w-1/4" /> {/* Label skeleton */}
        <Skeleton className="h-10 w-full" /> {/* Input skeleton */}
        <Skeleton className="h-10 w-full mt-6" /> {/* Button skeleton */}
        <Skeleton className="h-4 w-1/2 mx-auto mt-4" /> {/* Link/text skeleton */}
      </div>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold text-gray-900">Welcome Back</CardTitle>
        <CardDescription className="text-gray-600">
          Enter your credentials to access your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#db4b0d] focus:border-transparent"
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-gray-700">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="py-2 px-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#db4b0d] focus:border-transparent"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#db4b0d] hover:bg-[#c4420c] text-white py-2 px-4 rounded-lg transition-colors duration-200"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <span className="h-4 w-4 border-t-2 border-white border-solid rounded-full animate-spin mr-2"></span>
                Signing in...
              </span>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm text-gray-600">
          <p>
            Don't have an account?{" "}
            <a
              href="/auth/signup"
              className="font-semibold text-[#db4b0d] hover:text-[#c4420c] transition-colors"
            >
              Sign up
            </a>
          </p>
        </div>

        <div className="mt-2 text-center text-sm text-gray-600">
          <a
            href="/auth/forgot-password"
            className="font-semibold text-[#db4b0d] hover:text-[#c4420c] transition-colors"
          >
            Forgot password?
          </a>
        </div>
      </CardContent>
    </Card>
  );
};

export default LoginForm;
