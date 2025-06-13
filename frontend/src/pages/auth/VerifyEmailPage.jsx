// src/pages/VerifyEmailPage.jsx
import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useVerifyEmail } from '@/querys/auth';
import { Loader2 } from 'lucide-react';

function VerifyEmailPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { mutate: verifyEmail, isPending } = useVerifyEmail();

  useEffect(() => {
    if (token) {
      verifyEmail(token);
    } else {
      navigate('/register');
    }
  }, [token, verifyEmail, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center p-8 max-w-md">
        {isPending ? (
          <>
            <Loader2 className="mx-auto h-12 w-12 animate-spin" />
            <h1 className="mt-4 text-2xl font-bold">Verifying your email...</h1>
            <p className="mt-2 text-muted-foreground">
              Please wait while we verify your email address.
            </p>
          </>
        ) : null}
      </div>
    </div>
  );
}

export default VerifyEmailPage;