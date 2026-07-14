import { convexAuth } from "@convex-dev/auth/server";
import Password from "@auth/core/providers/credentials";

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [
    // We would add Google here later if needed, but keeping it simple for now or using Password
    Password,
  ],
});
