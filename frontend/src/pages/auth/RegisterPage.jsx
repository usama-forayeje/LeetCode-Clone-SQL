import { Link, Navigate, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import { useGoogleAuth, useSignUp } from '@/querys/auth';
import { signUpSchema } from '@/schemas/auth';

// Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

function RegisterPage() {
  const { mutate: signUp, isPending } = useSignUp();
  const { mutate: googleAuth } = useGoogleAuth();
  const navigate = useNavigate();


  const form = useForm({
    resetMode: "onSubmit",
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (data) => {
    signUp(data);
    navigate("/verify-email", { state: { email: data.email } });
  };

  const handleGoogleSuccess = (credentialResponse) => {
    googleAuth(credentialResponse.credential, {
      onSuccess: () => navigate("/dashboard"),
    });
  };
  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-background">
      <Card className="w-full max-w-md shadow-lg rounded-2xl border border-border">
        <CardHeader className="text-center space-y-1">
          <CardTitle className="text-3xl font-bold">Create an Account</CardTitle>
          <CardDescription>Fill in your details to register.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="you@example.com" {...field} />
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
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={isPending}
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Account
              </Button>
            </form>
          </Form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">or</span>
            </div>
          </div>

          <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
            <GoogleLogin
              onSuccess={(credentialResponse) => {
                googleAuth(credentialResponse.credential, {
                  onSuccess: () => navigate("/dashboard"),
                  onError: (error) => toast.error("Google login failed"),
                });
              }}
              onError={() => toast.error("Google login failed")}
              useOneTap
              text="continue_with"
              shape="rectangular"
              size="large"
              width="100%"
            />
          </GoogleOAuthProvider>

          <div className="text-center text-sm">
            Already have an account?{' '}
            <Link to="/login" className="underline text-primary hover:text-primary/80">
              Log in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


export default RegisterPage