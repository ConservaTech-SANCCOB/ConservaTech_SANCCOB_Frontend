import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./lib/auth-context";
import { ThemeProvider } from "./lib/theme-context";

// Nunito: rounded and friendly, and still easy to read at large sizes. It's a variable font,
// so one file covers every weight we use (500 to 900). globals.css reads it as --font-nunito.
const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SANCCOB Portal",
  description: "ConservaTech volunteer and roster portal for SANCCOB",
};

// Runs before first paint so a saved dark preference never flashes white.
// Mirrors theme-context.tsx: no saved value means "light" (the current
// DEFAULT_THEME). When that default becomes "system", change the null case here too.

const themeInitScript = `
(function () {
  try {
    var saved = localStorage.getItem("sanccob-theme");
    var dark =
      saved === "dark" ||
      (saved === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    if (dark) {
      document.documentElement.classList.add("dark");
      document.documentElement.style.colorScheme = "dark";
    }
  } catch (ignored) {}
})();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: the init script changes <html> before React hydrates.
    <html
      lang="en"
      suppressHydrationWarning
      className={`${nunito.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

//------------------------------------0-0-0- End Of File -0-0-0------------------------------------------------------//