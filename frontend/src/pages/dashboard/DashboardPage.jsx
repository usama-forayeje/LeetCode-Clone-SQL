import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCurrentUser, useSignOut } from '@/querys/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@radix-ui/react-avatar';
import {
  User,
  Mail,
  Shield,
  CheckCircle,
  XCircle,
  Calendar,
  Trophy,
  ShoppingBag,
  LogOut,
  Crown,
  Badge
} from 'lucide-react';
import React from 'react'

function DashboardPage() {
  const { data: user, isLoading } = useCurrentUser();
  const { mutate: signOut } = useSignOut();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Extract the actual user data
  const userData = user?.user || user;
  console.log(userData);


  // Get user initials for avatar fallback
  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto py-8 px-4">
        {/* Header Section */}
        <div className="mb-8">
          <Card className="border-0 shadow-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <CardContent className="p-8">
              <div className="flex items-center space-x-6">
                <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                  <AvatarImage
                    src={userData?.
                      profileImage
                    }
                    alt={userData?.fullname || 'User Avatar'}
                  />
                  <AvatarFallback className="text-2xl font-bold bg-white text-blue-600">
                    {getInitials(userData?.fullname)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold">
                      {userData?.fullname || userData?.username || 'Welcome User'}
                    </h1>
                    {userData?.role === 'ADMIN' && (
                      <Crown className="h-6 w-6 text-yellow-300" />
                    )}
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <Mail className="h-4 w-4" />
                    <span className="text-blue-100">{userData?.email}</span>
                  </div>

                  <div className="flex gap-2">
                    <Badge variant={userData?.isActive ? "secondary" : "destructive"} className="bg-white/20 text-white">
                      {userData?.isActive ? (
                        <><CheckCircle className="h-3 w-3 mr-1" /> Active</>
                      ) : (
                        <><XCircle className="h-3 w-3 mr-1" /> Inactive</>
                      )}
                    </Badge>

                    <Badge variant="secondary" className="bg-white/20 text-white">
                      {userData?.isGoogleAuth ? '🔗 Google' : '📧 Email'}
                    </Badge>

                    <Badge variant={userData?.isEmailVerified ? "secondary" : "destructive"} className="bg-white/20 text-white">
                      {userData?.isEmailVerified ? '✅ Verified' : '❌ Unverified'}
                    </Badge>
                  </div>
                </div>

                <Button
                  onClick={() => signOut()}
                  variant="secondary"
                  className="bg-white/20 text-white border-white/30 hover:bg-white/30"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Problems Solved
              </CardTitle>
              <Trophy className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {userData?.problemSolved?.length || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Keep solving to improve your rank!
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Purchases
              </CardTitle>
              <ShoppingBag className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {userData?.purchases?.length || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Premium features unlocked
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Account Age
              </CardTitle>
              <Calendar className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {userData?.createdAt ?
                  Math.floor((new Date() - new Date(userData.createdAt)) / (1000 * 60 * 60 * 24))
                  : 0
                } days
              </div>
              <p className="text-xs text-muted-foreground">
                Member since {formatDate(userData?.createdAt)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Account Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="font-medium">Full Name:</span>
                <span className="text-muted-foreground">{userData?.fullname || 'Not set'}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b">
                <span className="font-medium">Username:</span>
                <span className="text-muted-foreground">{userData?.username || 'Not set'}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b">
                <span className="font-medium">Role:</span>
                <Badge variant={userData?.role === 'ADMIN' ? 'default' : 'secondary'}>
                  {userData?.role || 'USER'}
                </Badge>
              </div>

              <div className="flex justify-between items-center py-2 border-b">
                <span className="font-medium">Last Login:</span>
                <span className="text-muted-foreground">{formatDate(userData?.lastLoginAt)}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security & Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="font-medium">Account Status:</span>
                <Badge variant={userData?.isActive ? 'default' : 'destructive'}>
                  {userData?.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              <div className="flex justify-between items-center py-2 border-b">
                <span className="font-medium">Email Verification:</span>
                <Badge variant={userData?.isEmailVerified ? 'default' : 'destructive'}>
                  {userData?.isEmailVerified ? 'Verified' : 'Not Verified'}
                </Badge>
              </div>

              <div className="flex justify-between items-center py-2 border-b">
                <span className="font-medium">Authentication:</span>
                <Badge variant="secondary">
                  {userData?.isGoogleAuth ? 'Google OAuth' : 'Email & Password'}
                </Badge>
              </div>

              <div className="flex justify-between items-center py-2 border-b">
                <span className="font-medium">Password Changed:</span>
                <span className="text-muted-foreground">
                  {userData?.passwordChangedAt ? formatDate(userData.passwordChangedAt) : 'Never'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage