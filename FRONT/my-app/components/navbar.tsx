"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ChevronDown, Globe } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/lib/translations";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const { language, setLanguage } = useLanguage();
  const t = translations[language];

  const [user, setUser] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setOpen(false);
    router.push("/login");
  };

  const username =
    user?.user_metadata?.username || user?.email?.split("@")[0];

  const languageLabel =
    language === "en" ? "EN" : language === "hi" ? "हिंदी" : "मराठी";

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border/50 shadow-sm">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex h-16 items-center justify-between">

          {/* LOGO */}
          <Link href="/" className="group flex items-center gap-2 text-xl font-semibold">
            <span className="text-2xl transition-transform group-hover:rotate-[-8deg] group-hover:scale-110">
              ❤️
            </span>
            <span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
              Healigram
            </span>
          </Link>

          {/* NAV LINKS + AUTH + LANGUAGE */}
          <div className="hidden md:flex items-center gap-6">
            {[
              { path: "/", label: t.navHome },
              { path: "/about", label: t.navAbout },
              { path: "/predict", label: t.navPredict },
            ].map((item) => {
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className="group relative text-sm font-medium transition"
                >
                  <span
                    className={`${active ? "text-primary" : "text-foreground"} group-hover:text-primary`}
                  >
                    {item.label}
                  </span>
                  <span
                    className={`absolute left-0 -bottom-1 h-[2px] bg-gradient-to-r from-indigo-500 to-purple-500 transition-all ${
                      active ? "w-full" : "w-0 group-hover:w-full"
                    }`}
                  />
                </Link>
              );
            })}

            {/* AUTH */}
            {!user ? (
              <Link
                href="/login"
                className="rounded-full border px-4 py-2 text-sm font-medium hover:bg-muted transition"
              >
                {t.loginSignup}
              </Link>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setOpen(!open)}
                  className="flex items-center gap-2 rounded-full border px-3 py-1.5 bg-background hover:bg-muted transition"
                >
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white flex items-center justify-center font-semibold">
                    {username?.charAt(0)?.toUpperCase()}
                  </div>
                  <span className="text-sm">
                    {t.hi}, <span className="font-medium">{username}</span>
                  </span>
                  <ChevronDown className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} />
                </button>

                {open && (
                  <div className="absolute right-0 mt-3 w-44 rounded-2xl border bg-background shadow-xl overflow-hidden">
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-3 text-left text-sm hover:bg-red-50 hover:text-red-600 transition"
                    >
                      {t.logout}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* LANGUAGE DROPDOWN */}
            <div className="relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-2 rounded-full border px-3 py-2 text-sm hover:bg-muted transition"
              >
                <Globe className="h-4 w-4" />
                {languageLabel}
                <ChevronDown className={`h-4 w-4 transition ${langOpen ? "rotate-180" : ""}`} />
              </button>

              {langOpen && (
                <div className="absolute right-0 mt-2 w-36 rounded-xl border bg-background shadow-lg overflow-hidden">
                  {[
                    { code: "en", label: "English" },
                    { code: "hi", label: "हिंदी" },
                    { code: "mr", label: "मराठी" },
                  ].map((l) => (
                    <button
                      key={l.code}
                      onClick={() => {
                        setLanguage(l.code as any);
                        setLangOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-muted transition"
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </nav>
  );
}
