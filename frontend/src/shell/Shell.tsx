import { useState } from "react";
import { Outlet } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Sidebar } from "../components/shared/Sidebar";
import { Navbar } from "../components/shared/Navbar";
import { BottomBar } from "../components/shared/BottomBar";
export function Shell() {
  const [open, setOpen] = useState(false);
  return (
    <div className="app-shell md:flex">
      <div className="hidden md:block">
        <Sidebar />
      </div>
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            className="absolute inset-0 bg-ink/70 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          />
          <div className="relative h-full w-[270px]">
            <Sidebar close={() => setOpen(false)} />
          </div>
        </div>
      )}
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <Navbar onMenu={() => setOpen(true)} />
        <main className="mx-auto w-full max-w-[1520px] flex-1 p-5 md:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
        <BottomBar />
      </div>
    </div>
  );
}
