const domain =
  process.env.CONVEX_SITE_URL ||
  (process.env.NEXT_PUBLIC_CONVEX_URL
    ? process.env.NEXT_PUBLIC_CONVEX_URL.replace(".convex.cloud", ".convex.site")
    : "");

export default {
  providers: [
    {
      domain,
      applicationID: "convex",
    },
  ],
};

