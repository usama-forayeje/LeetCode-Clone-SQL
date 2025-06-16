import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router"
import { motion } from "framer-motion"
import { useVerifyEmail } from "@/querys/auth"
import { Loader2, CheckCircle, XCircle, RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

function VerifyEmailPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const { mutate: verifyEmail, isPending, isError, error, isSuccess } = useVerifyEmail()
  const [hasAttempted, setHasAttempted] = useState(false)

  useEffect(() => {
    if (token && !hasAttempted) {
      setHasAttempted(true)
      verifyEmail(token)
    } else if (!token) {
      navigate("/register")
    }
  }, [token, navigate, verifyEmail, hasAttempted])

  const handleRetryVerification = () => {
    if (token) {
      setHasAttempted(false)
      setTimeout(() => {
        setHasAttempted(true)
        verifyEmail(token)
      }, 100)
    }
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
            <CardTitle className="text-2xl font-bold">Email Verification</CardTitle>
          </CardHeader>

          <CardContent className="text-center space-y-6">
            {isPending && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                >
                  <Loader2 className="mx-auto h-16 w-16 text-primary" />
                </motion.div>
                <h2 className="text-xl font-semibold">Verifying your email...</h2>
                <p className="text-muted-foreground">Please wait while we verify your email address.</p>
                <div className="w-full bg-muted rounded-full h-2">
                  <motion.div
                    className="bg-primary h-2 rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 3, ease: "easeInOut" }}
                  />
                </div>
              </motion.div>
            )}

            {isError && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 10 }}
                >
                  <XCircle className="mx-auto h-16 w-16 text-destructive" />
                </motion.div>
                <h2 className="text-xl font-semibold text-destructive">Verification Failed</h2>
                <p className="text-muted-foreground">
                  {(error)?.response?.data?.message ||
                    "Email verification failed. The link may be expired or invalid."}
                </p>
                <div className="space-y-3 pt-4">
                  <Button onClick={handleRetryVerification} className="w-full" disabled={isPending}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Try Again
                  </Button>
                  <Button variant="outline" onClick={() => navigate("/register")} className="w-full">
                    Back to Register
                  </Button>
                </div>
              </motion.div>
            )}

            {isSuccess && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 10 }}
                >
                  <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
                </motion.div>
                <h2 className="text-xl font-semibold text-green-600">Email Verified!</h2>
                <p className="text-muted-foreground">
                  Your email has been successfully verified. Redirecting to dashboard...
                </p>
                <div className="w-full bg-muted rounded-full h-2">
                  <motion.div
                    className="bg-green-500 h-2 rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 2, ease: "easeInOut" }}
                  />
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

export default VerifyEmailPage
