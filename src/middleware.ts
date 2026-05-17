export { default } from "next-auth/middleware";
export const config = {
  matcher: ["/dashboard/:path*", "/history/:path*", "/reports/:path*", "/settings/:path*"],
};
