import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // מאפשר בנייה לבדיקה בלי להתנגש בשרת הפיתוח (NEXT_DIST_DIR=.next-check)
  distDir: process.env.NEXT_DIST_DIR || ".next",
  outputFileTracingRoot: process.cwd(),
  // הקטלוג ועמודי המוצר הוסרו — קישורים ישנים מובילים לסטודיו
  async redirects() {
    return [
      { source: "/catalog", destination: "/studio", permanent: false },
      { source: "/product/:slug", destination: "/studio?template=:slug", permanent: false },
    ];
  },
  // כותרות אבטחה בסיסיות. CSP מלא יוגדר יחד עם ה-Backend וספק הסליקה.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
