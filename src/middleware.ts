import { withAuth } from "next-auth/middleware";

/**
 * הגנה על אזורים פרטיים:
 * - /account — לקוחות מחוברים
 * - /admin   — רק מנהלות (role=admin, לפי ADMIN_EMAILS)
 * כל עמוד ו-API בודקים את ההרשאה שוב גם בצד השרת.
 */
export default withAuth({
  pages: { signIn: "/login" },
  callbacks: {
    authorized: ({ token, req }) => {
      if (req.nextUrl.pathname.startsWith("/admin")) return token?.role === "admin";
      return !!token;
    },
  },
});

export const config = { matcher: ["/admin/:path*", "/account/:path*"] };
