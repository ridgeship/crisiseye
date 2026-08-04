import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [
    Password({
      validatePasswordRequirements(password) {
        if (!password) {
          throw new Error("Password is required");
        }
      },
      profile(params) {
        return {
          email: params.email as string,
          name: params.name as string,
          role: (params.role as string) || "citizen",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
      },
    }),
  ],
});
