"use client";

import { SignIn, useSignIn } from "@clerk/nextjs";
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton component

const LoginForm: React.FC = () => {
  const { isLoaded } = useSignIn();

  return (
    <div>
      {!isLoaded ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4 mx-auto mb-6" /> {/* Title skeleton */}
          <Skeleton className="h-6 w-1/4" /> {/* Label skeleton */}
          <Skeleton className="h-10 w-full" /> {/* Input skeleton */}
          <Skeleton className="h-6 w-1/4" /> {/* Label skeleton */}
          <Skeleton className="h-10 w-full" /> {/* Input skeleton */}
          <Skeleton className="h-10 w-full mt-6" /> {/* Button skeleton */}
          <Skeleton className="h-4 w-1/2 mx-auto mt-4" /> {/* Link/text skeleton */}
        </div>
      ) : (
        <SignIn path="/auth/login" />
      )}
    </div>
  );
}

export default LoginForm;
