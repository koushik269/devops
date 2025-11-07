import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">VPS Portal</h1>
              <nav className="ml-10 flex items-center space-x-4">
                <a href="#" className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  Dashboard
                </a>
                <a href="#" className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  My VPS
                </a>
                <a href="#" className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  Billing
                </a>
                <a href="#" className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  Support
                </a>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Welcome, {user.firstName} {user.lastName}
              </span>
              <Button onClick={logout} variant="outline" size="sm">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Welcome to your VPS Dashboard
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Quick Actions */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Button variant="primary" className="w-full">
                    Create New VPS
                  </Button>
                  <Button variant="outline" className="w-full">
                    View All VPS
                  </Button>
                  <Button variant="outline" className="w-full">
                    Billing History
                  </Button>
                </div>
              </div>

              {/* Account Overview */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Account Overview</h3>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                    <dd className="text-sm text-gray-900">{user.email}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Account Status</dt>
                    <dd className="text-sm text-gray-900">{user.status}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Email Verified</dt>
                    <dd className="text-sm text-gray-900">
                      {user.emailVerified ? 'Yes' : 'No'}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">2FA Enabled</dt>
                    <dd className="text-sm text-gray-900">
                      {user.twoFactorEnabled ? 'Yes' : 'No'}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Recent Activity */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Logged in successfully</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    No recent VPS activity
                  </div>
                </div>
              </div>
            </div>

            {/* VPS Configuration Section Preview */}
            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Configure Your First VPS</h3>
              <div className="bg-gray-100 p-6 rounded-lg">
                <p className="text-gray-600 mb-4">
                  Get started by configuring your custom VPS with our intuitive interface.
                </p>
                <Button variant="primary">
                  Start Configuration
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}