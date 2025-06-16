import { Link, Outlet } from "react-router"
import { motion } from "framer-motion"
import { Code2, Sparkles, Shield, Zap } from "lucide-react"

function AuthLayout() {
  const features = [
    {
      icon: Code2,
      title: "Practice Coding",
      description: "Solve problems and improve your skills",
    },
    {
      icon: Sparkles,
      title: "AI-Powered Hints",
      description: "Get intelligent suggestions when stuck",
    },
    {
      icon: Shield,
      title: "Secure Platform",
      description: "Your data is protected with enterprise security",
    },
    {
      icon: Zap,
      title: "Real-time Feedback",
      description: "Instant code execution and results",
    },
  ]

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding & Features */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary/90 to-primary/80 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid-white/10 bg-grid-16" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent" />

        {/* Floating Elements */}
        <motion.div
          className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-xl"
          animate={{
            y: [0, -20, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 6,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-40 right-20 w-24 h-24 bg-white/10 rounded-full blur-xl"
          animate={{
            y: [0, 20, 0],
            scale: [1, 0.9, 1],
          }}
          transition={{
            duration: 4,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />

        <div className="relative z-10 flex flex-col justify-center px-12 py-16 text-white">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <Link to="/" className="inline-flex items-center space-x-3 mb-8">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Code2 className="w-7 h-7" />
              </div>
              <span className="text-3xl font-bold">CodeMaster</span>
            </Link>

            <h1 className="text-5xl font-bold leading-tight mb-6">
              Master Coding
              <br />
              <span className="text-white/80">One Problem at a Time</span>
            </h1>

            <p className="text-xl text-white/80 mb-12 leading-relaxed">
              Join thousands of developers improving their skills with our comprehensive coding platform.
            </p>

            <div className="space-y-6">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="flex items-center space-x-4"
                >
                  <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center">
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{feature.title}</h3>
                    <p className="text-white/70">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Auth Forms */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden text-center mb-8">
            <Link to="/" className="inline-flex items-center space-x-2 text-primary">
              <Code2 className="w-8 h-8" />
              <span className="text-2xl font-bold">CodeMaster</span>
            </Link>
          </div>

          <Outlet />

          <footer className="text-center text-sm text-muted-foreground mt-8">
            &copy; {new Date().getFullYear()} CodeMaster. All rights reserved.
          </footer>
        </motion.div>
      </div>
    </div>
  )
}

export default AuthLayout
