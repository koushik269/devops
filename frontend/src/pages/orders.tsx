import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';

interface Order {
  id: string;
  cpuCores: number;
  ramGb: number;
  storageGb: number;
  operatingSystem: string;
  datacenterLocation: string;
  monthlyPrice: number;
  status: 'PENDING' | 'PAID' | 'APPROVED' | 'PROVISIONING' | 'ACTIVE' | 'SUSPENDED' | 'CANCELLED';
  createdAt: string;
  approvedAt?: string;
}

export default function OrdersPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    // Check for success message from order placement
    const { success } = router.query;
    if (success === 'true') {
      // TODO: Show success toast notification
    }

    fetchOrders();
  }, [isLoading, isAuthenticated, router]);

  const fetchOrders = async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await vpsApi.getOrders();

      // Mock data for demonstration
      const mockOrders: Order[] = [
        {
          id: 'order_1',
          cpuCores: 2,
          ramGb: 4,
          storageGb: 50,
          operatingSystem: 'Ubuntu 22.04 LTS',
          datacenterLocation: 'US-EAST-1',
          monthlyPrice: 26.00,
          status: 'PENDING',
          createdAt: new Date().toISOString(),
        },
      ];

      setOrders(mockOrders);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: Order['status']) => {
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      PAID: 'bg-blue-100 text-blue-800',
      APPROVED: 'bg-purple-100 text-purple-800',
      PROVISIONING: 'bg-indigo-100 text-indigo-800',
      ACTIVE: 'bg-green-100 text-green-800',
      SUSPENDED: 'bg-red-100 text-red-800',
      CANCELLED: 'bg-gray-100 text-gray-800',
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
        {status}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
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
                <a href="/dashboard" className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  Dashboard
                </a>
                <a href="/configure" className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  Configure VPS
                </a>
                <a href="#" className="text-primary-700 bg-primary-100 px-3 py-2 rounded-md text-sm font-medium">
                  My Orders
                </a>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <Button onClick={() => router.push('/configure')} variant="primary" size="sm">
                Create New VPS
              </Button>
              <span className="text-sm text-gray-700">
                {user.firstName} {user.lastName}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">My Orders</h2>
            <p className="mt-1 text-sm text-gray-600">
              Track the status of your VPS orders and manage your active instances
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : orders.length === 0 ? (
            <Card>
              <CardBody className="text-center py-12">
                <div className="mx-auto h-12 w-12 text-gray-400">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No orders yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating your first VPS configuration.
                </p>
                <div className="mt-6">
                  <Button onClick={() => router.push('/configure')} variant="primary">
                    Create Your First VPS
                  </Button>
                </div>
              </CardBody>
            </Card>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <Card key={order.id}>
                  <CardBody>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-medium text-gray-900">
                            Order #{order.id}
                          </h3>
                          {getStatusBadge(order.status)}
                        </div>
                        <div className="mt-4">
                          <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-3">
                            <div>
                              <dt className="text-sm font-medium text-gray-500">Specifications</dt>
                              <dd className="mt-1 text-sm text-gray-900">
                                {order.cpuCores} cores, {order.ramGb}GB RAM, {order.storageGb}GB storage
                              </dd>
                            </div>
                            <div>
                              <dt className="text-sm font-medium text-gray-500">Operating System</dt>
                              <dd className="mt-1 text-sm text-gray-900">{order.operatingSystem}</dd>
                            </div>
                            <div>
                              <dt className="text-sm font-medium text-gray-500">Monthly Price</dt>
                              <dd className="mt-1 text-sm font-medium text-gray-900">
                                ${order.monthlyPrice.toFixed(2)}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-sm font-medium text-gray-500">Created</dt>
                              <dd className="mt-1 text-sm text-gray-900">{formatDate(order.createdAt)}</dd>
                            </div>
                            <div>
                              <dt className="text-sm font-medium text-gray-500">Location</dt>
                              <dd className="mt-1 text-sm text-gray-900">{order.datacenterLocation}</dd>
                            </div>
                            <div>
                              <dt className="text-sm font-medium text-gray-500">Status</dt>
                              <dd className="mt-1 text-sm text-gray-900">{order.status}</dd>
                            </div>
                          </dl>
                        </div>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <div className="space-y-2">
                          {order.status === 'ACTIVE' && (
                            <Button variant="primary" size="sm">
                              Manage VPS
                            </Button>
                          )}
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}