
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/auth-context";

//---------------------------------------------------------------------------------------------------------------//
// Slideshow Images
//---------------------------------------------------------------------------------------------------------------//

//<summary>
// Existing SANCCOB conservation images stored in the public folder.
// The spaces in the filenames are URL-encoded for use in image paths.
//</summary>
//---------------------------------------------------------------------------------------------------------------//
const HERO_IMAGES = [
  {
    src: "/slideshow%20image.%201.jpeg",
    alt: "SANCCOB seabird conservation photograph 1",
  },
  {
    src: "/slideshow%20image.2.jpeg",
    alt: "SANCCOB seabird conservation photograph 2",
  },
  {
    src: "/slideshow%20image.3.jpeg",
    alt: "SANCCOB seabird conservation photograph 3",
  },
];

//---------------------------------------------------------------------------------------------------------------//
// Main Page Component
//---------------------------------------------------------------------------------------------------------------//

//-----------------------------------------------------------------------------------------------//
//<summary>
// Admin portal login page. Shows a fading slideshow alongside a sign-in form
// (email, password, keep-me-signed-in). Redirects to /dashboard once the user
// is authenticated, and displays any login error above the form.
//</summary>
//-----------------------------------------------------------------------------------------------//
export default function LoginPage() {
  const router = useRouter();
  const { login, token, isLoading } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  //-----------------------------------------------------------------------------------------------//
  //<summary>
  // Redirects already-authenticated users straight to the dashboard once
  // the auth state has finished loading.
  //</summary>
  //-----------------------------------------------------------------------------------------------//
  useEffect(() => {
    if (!isLoading && token) {
      router.replace("/dashboard");
    }
  }, [isLoading, token, router]);

  //-----------------------------------------------------------------------------------------------//
  //<summary>
  // Automatically advances the hero slideshow every six seconds.
  // The interval is cleared when the component unmounts.
  //</summary>
  //-----------------------------------------------------------------------------------------------//
  useEffect(() => {
    const slideshowInterval = window.setInterval(() => {
      setActiveSlide((currentSlide) => (currentSlide + 1) % HERO_IMAGES.length);
    }, 6000);

    return () => {
      window.clearInterval(slideshowInterval);
    };
  }, []);

  //-----------------------------------------------------------------------------------------------//
  //<summary>
  // Submits the login form. Trims the email, calls login with the
  // keep-signed-in preference, then navigates to /dashboard. On failure the
  // error message is shown to the user.
  //</summary>
  //-----------------------------------------------------------------------------------------------//
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      // Trim whitespace before passing to login
      await login(email.trim(), password, keepSignedIn);
      router.push("/dashboard");
    } catch (err) {
      console.error("[Login Error]:", err);
      setError(
        err instanceof Error && err.message
          ? err.message
          : "Invalid email or password. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  //-----------------------------------------------------------------------------------------------//
  // Render Guard: show nothing while auth is loading or the user is already signed in
  //-----------------------------------------------------------------------------------------------//
  if (isLoading || token) {
    return null;
  }

  //---------------------------------------------------------------------------------------------------------------//
  // Render
  //---------------------------------------------------------------------------------------------------------------//
  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950">
      {/*------------------------------------ Left Side: Image Slideshow ----------------------------------------------------*/}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden bg-slate-900">
        {/*------------------------------------ Slideshow Images ----------------------------------------------------*/}
        {HERO_IMAGES.map((image, index) => (
        <Image
          key={image.src}
          src={image.src}
          alt={image.alt}
          fill
          loading="eager"
          // quality={90}
          sizes="50vw"
         className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
          activeSlide === index
           ? "opacity-100"
           : "opacity-0"
      } ${
        index === 2
         ? "object-contain"
         : "object-cover"
    }`}
       />
        ))}
      </div>

      {/*------------------------------------ Right Side: Login Form ----------------------------------------------------*/}
      <div className="flex w-full lg:w-1/2 items-center justify-center px-6 py-6">
        <div className="w-full max-w-md">
          {/*------------------------------------ SANCCOB Logo ----------------------------------------------------*/}
          {/* The JPEG has a light grey background, so mix-blend-multiply lets it melt into the light page,
              and the pale container keeps it looking intentional in dark mode. */}
          <div className="mb-5 overflow-hidden rounded-2xl dark:bg-slate-100">
            <Image
              src="/sanccob-logo.jpeg"
              alt="SANCCOB Saves Seabirds"
              width={1600}
              height={677}
              priority
              className="h-28 w-full object-cover mix-blend-multiply"
            />
          </div>

          {/*------------------------------------ Login Card ----------------------------------------------------*/}
          <div className="rounded-2xl bg-white dark:bg-slate-900 p-10 shadow-sm border border-slate-100 dark:border-slate-800">
            {/*------------------------------------ Card Heading ----------------------------------------------------*/}
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Welcome back
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Sign in to the SANCCOB Admin portal
            </p>

            {/*------------------------------------ Error Message Display ----------------------------------------------------*/}
            {error && (
              <div className="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs font-medium text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            {/*------------------------------------ Sign-In Form ----------------------------------------------------*/}
            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              {/*------------------------------------ Email Field ----------------------------------------------------*/}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5"
                >
                  Email address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                    <MailIcon />
                  </span>
                  <input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@sanccob.co.za"
                    className="w-full border rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 py-3 pl-10 pr-4 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-800 dark:focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/*------------------------------------ Password Field ----------------------------------------------------*/}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="password"
                    className="block text-sm font-semibold text-slate-800 dark:text-slate-200"
                  >
                    Password
                  </label>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                    <LockIcon />
                  </span>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 py-3 pl-10 pr-10 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-800 dark:focus:ring-blue-500 focus:border-transparent"
                  />

                  {/*------------------------------------ Show / Hide Password Toggle ----------------------------------------------------*/}
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    <EyeIcon open={showPassword} />
                  </button>
                </div>
              </div>

              {/*------------------------------------ Keep Signed In ----------------------------------------------------*/}
              <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={keepSignedIn}
                  onChange={(e) => setKeepSignedIn(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 dark:bg-slate-800 text-slate-900 focus:ring-blue-800"
                />
                Keep me signed in
              </label>

              {/*------------------------------------ Submit Button ----------------------------------------------------*/}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl bg-blue-900 py-3 text-sm font-semibold text-white hover:bg-blue-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-800 focus:ring-offset-2 dark:focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Signing in..." : "Sign In"}
              </button>
            </form>
          </div>

          {/*------------------------------------ Footer ----------------------------------------------------*/}
          <p className="mt-6 text-center text-xs text-slate-400 dark:text-slate-500">
            © 2026 SANCCOB · ConservaTech Admin Portal · v3.1.0
          </p>
        </div>
      </div>
    </div>
  );
}

//---------------------------------------------ICONS------------------------------------------------------------------//

//-----------------------------------------------------------------------------------------------//
//<summary>
// Envelope icon shown inside the email input.
//</summary>
//-----------------------------------------------------------------------------------------------//
function MailIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 6-10 7L2 6" />
    </svg>
  );
}

//-----------------------------------------------------------------------------------------------//
//<summary>
// Padlock icon shown inside the password input.
//</summary>
//-----------------------------------------------------------------------------------------------//
function LockIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

//-----------------------------------------------------------------------------------------------//
//<summary>
// Eye icon for the show/hide password toggle. Renders an open eye when the
// password is visible and a crossed-out eye when it is hidden.
//</summary>
//-----------------------------------------------------------------------------------------------//
function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c6 0 10 7 10 7a13.16 13.16 0 0 1-3 3.88M6.6 6.6C3.5 8.6 2 12 2 12s4 7 10 7a9.6 9.6 0 0 0 4.4-1" />
      <path d="M2 2l20 20" />
    </svg>
  );
}

//------------------------------------0-0-0- End Of File -0-0-0------------------------------------------------------//
