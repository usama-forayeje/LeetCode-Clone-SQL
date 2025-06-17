import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { motion } from "framer-motion"
import { Loader2, Eye, EyeOff } from "lucide-react"
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google"
import { useGoogleAuth, useSignIn } from "@/querys/auth"
import { signInSchema } from "@/schemas/auth"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { Link, Navigate, useNavigate } from "react-router"
import { toast } from "sonner"

function LoginPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const { mutate: signIn, isPending } = useSignIn({
    onSuccess: () => {
      toast.success("Login successfully.");
      navigate("/dashboard");
    },
    onError: (error) => {
      const backendErrors = error.response?.data?.errors;
      if (backendErrors && Array.isArray(backendErrors)) {
        backendErrors.forEach(err => {
          if (err.path && err.path[0]) {
            form.setError(err.path[0], {
              type: "server",
              message: err.message,
            });
          }
        });
      } else {
        const errorMessage = error.response?.data?.message || "Login failed. Please check your credentials.";
        form.setError("email", {
          type: "server",
          message: errorMessage,
        });
      }
    },
  });

  const { mutate: googleAuth } = useGoogleAuth({
    onError: (error) => {
      toast.error(error.response?.data?.message || "Google registration failed");
    }
  })

  const form = useForm({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const onSubmit = (data) => {
    signIn(data)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Card className="border-0 shadow-2xl bg-card/50 backdrop-blur-sm">
        <CardHeader className="text-center space-y-2 pb-6">
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-base">Sign in to continue your coding journey</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Google Sign In */}
          <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <GoogleLogin
                onSuccess={(credentialResponse) => {
                  googleAuth(credentialResponse.credential)
                }}
                onError={() => { }}
                useOneTap={false}
                text="signin_with"
                shape="rectangular"
                size="large"
                width="100%"
                theme="outline"
              />
            </motion.div>
          </GoogleOAuthProvider>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="you@example.com" {...field} className="h-11" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          {...field}
                          className="h-11 pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox id="remember" checked={rememberMe} onCheckedChange={setRememberMe} />
                  <label
                    htmlFor="remember"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Remember me
                  </label>
                </div>
                <Link
                  to="/forgot-password"
                  className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button type="submit" className="w-full h-11 text-base font-medium" disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign In
                </Button>
              </motion.div>
            </form>
          </Form>

          <div className="text-center text-sm">
            Don't have an account?{" "}
            <Link to="/register" className="font-medium text-primary hover:text-primary/80 transition-colors">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default LoginPage
