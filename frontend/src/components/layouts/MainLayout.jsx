"use client"

import { useState } from "react"
import { Outlet } from "react-router"
import { motion, AnimatePresence } from "framer-motion"
import { Toaster } from "sonner"
import { useCurrentUser } from "@/querys/auth"
import { Loader2 } from "lucide-react"

export default function MainLayout() {
  const { data: user, isLoading } = useCurrentUser()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your workspace...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden lg:flex lg:flex-shrink-0">
          {/* <Sidebar /> */}
        </div>

        {/* Mobile Sidebar */}
        {/* <AnimatePresence>
          {sidebarOpen && <MobileSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />}
        </AnimatePresence> */}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* <Header onMenuClick={() => setSidebarOpen(true)} /> */}

          <main className="flex-1 overflow-y-auto bg-muted/30">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </main>
        </div>
      </div>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "hsl(var(--background))",
            color: "hsl(var(--foreground))",
            border: "1px solid hsl(var(--border))",
          },
        }}
      />
    </div>
  )
}
