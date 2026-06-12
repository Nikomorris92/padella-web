"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import FloatingCTA from "@/components/FloatingCTA";

export default function PublicChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");
  const [isAdminUser, setIsAdminUser] = useState(false);

  useEffect(() => {
    setIsAdminUser(localStorage.getItem("padella_admin") === "true");
  }, [pathname]);

  return (
    <>
      {!isAdminRoute && <Navigation />}
      <main>{children}</main>
      {!isAdminRoute && <Footer />}
      {!isAdminRoute && <FloatingCTA />}

      {/* Floating Admin "A" — visibile solo per admin nelle pagine pubbliche.
          Top-right, fixed, z-index alto, separato da tutto il resto. */}
      <AnimatePresence>
        {!isAdminRoute && isAdminUser && (
          <motion.div
            initial={{ opacity: 0, scale: 0.6, x: 10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ type: "spring", damping: 22, stiffness: 320 }}
            className="fixed top-3 right-3 z-[80]"
          >
            <Link
              href="/admin"
              title="Vai al pannello admin"
              className="flex items-center justify-center w-10 h-10 rounded-full bg-padella-gold border-2 border-padella-gold hover:scale-110 active:scale-95 transition-all duration-200 shadow-xl"
            >
              <span className="text-padella-green font-display font-bold text-lg leading-none select-none">A</span>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
