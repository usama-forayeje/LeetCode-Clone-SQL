import { useCurrentUser, useSignOut } from '@/querys/auth';
import React from 'react'

function DashboardPage() {
  const { data: user, isLoading } = useCurrentUser();
  const { mutate: signOut } = useSignOut();
  if (isLoading) return <div>Loading...</div>;
  return (


    <div className="container py-12">
      <h1 className="text-2xl font-bold">Welcome, {user?.name}</h1>
      <p className="text-muted-foreground">Email: {user?.email}</p>

      <Button
        onClick={() => signOut()}
        className="mt-4"
        variant="destructive"
      >
        Sign Out
      </Button>
    </div>
  );

}

export default DashboardPage