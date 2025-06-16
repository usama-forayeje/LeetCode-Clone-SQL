import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { motion } from "framer-motion"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Eye, EyeOff, CheckCircle, XCircle, Shield } from "lucide-react"
import { useParams } from "react-router"
import { useResetPassword } from "@/querys/auth"
import { resetPasswordSchema } from "@/schemas/auth"
import { toast } from "sonner"

export function ResetPasswordPage() {
  const { token } = useParams()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const form = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  })

  const { mutate: resetPassword, isPending } = useResetPassword({
    onSuccess: () => {
      toast.success("Password reset successfully");
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
        toast.error(error.response?.data?.message || "Password reset failed");
      }
    },
  });

  const password = form.watch("password")
  const confirmPassword = form.watch("confirmPassword")

  const passwordRequirements = [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "One number", met: /\d/.test(password) },
  ]

  const onSubmit = (data) => {
    if (!token) return
    resetPassword({ token, password: data.password, confirmPassword: data.confirmPassword });
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Card className="border-0 shadow-2xl bg-card/50 backdrop-blur-sm">
        <CardHeader className="text-center space-y-2 pb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 10, delay: 0.2 }}
            className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4"
          >
            <Shield className="h-8 w-8 text-primary" />
          </motion.div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Reset Password
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <p className="text-muted-foreground text-center mb-6">
              Enter your new password below. Make sure it's strong and secure.
            </p>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
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
                      {password && (
                        <div className="space-y-2 mt-2">
                          {passwordRequirements.map((req, index) => (
                            <div key={index} className="flex items-center space-x-2 text-sm">
                              {req.met ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <XCircle className="h-4 w-4 text-muted-foreground" />
                              )}
                              <span className={req.met ? "text-green-600" : "text-muted-foreground"}>{req.label}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm New Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="••••••••"
                            {...field}
                            className="h-11 pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </FormControl>
                      {confirmPassword && password && (
                        <div className="flex items-center space-x-2 text-sm mt-2">
                          {password === confirmPassword ? (
                            <>
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="text-green-600">Passwords match</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-4 w-4 text-red-500" />
                              <span className="text-red-600">Passwords don't match</span>
                            </>
                          )}
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button type="submit" className="w-full h-11 text-base font-medium" disabled={isPending}>
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Reset Password
                  </Button>
                </motion.div>
              </form>
            </Form>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  )
}