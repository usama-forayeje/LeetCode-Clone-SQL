import { useState } from "react"
import { useLocation, useNavigate } from "react-router"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useResendVerificationEmail } from "@/querys/auth"
import { ArrowLeft, Mail, CheckCircle, Clock } from "lucide-react"

function CheckEmailPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const email = location.state?.email
  const { mutate: resendEmail, isPending } = useResendVerificationEmail()
  const [emailSent, setEmailSent] = useState(false)

  const handleResendEmail = () => {
    if (email) {
      resendEmail(email, {
        onSuccess: () => setEmailSent(true),
      })
    }
  }

  if (!email) {
    navigate("/register")
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full max-w-md shadow-2xl bg-card/50 backdrop-blur-sm border-0">
          <CardHeader className="text-center pb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 10, delay: 0.2 }}
              className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4"
            >
              <Mail className="h-8 w-8 text-primary" />
            </motion.div>
            <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
          </CardHeader>

          <CardContent className="text-center space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-4"
            >
              <p className="text-muted-foreground">We've sent a verification link to:</p>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="font-semibold text-lg break-all">{email}</p>
              </div>

              <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg text-sm">
                <div className="flex items-start space-x-3">
                  <Clock className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="text-left">
                    <p className="font-medium text-primary mb-1">Important:</p>
                    <p className="text-muted-foreground">
                      Click the link in the email to verify your account. The link will expire in 1 hour.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-4"
            >
              <p className="text-sm text-muted-foreground">Didn't receive the email? Check your spam folder or</p>

              <Button
                onClick={handleResendEmail}
                disabled={isPending || emailSent}
                variant="outline"
                className="w-full"
              >
                {isPending ? (
                  "Sending..."
                ) : emailSent ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                    Email sent!
                  </>
                ) : (
                  "Resend verification email"
                )}
              </Button>

              <Button onClick={() => navigate("/register")} variant="ghost" className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to register
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

export default CheckEmailPage
