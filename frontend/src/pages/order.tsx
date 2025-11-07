import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui/Card';

interface VPSConfiguration {
  cpuCores: number;
  ramGb: number;
  storageGb: number;
  operatingSystem: string;
  datacenterLocation: string;
}

interface Pricing {
  totalPrice: number;
  breakdown: {
    cpu: number;
    ram: number;
    storage: number;
    operatingSystem: number;
  };
}

const datacenters: { [key: string]: string } = {
  'US-EAST-1': 'US East - Virginia',
  'US-WEST-1': 'US West - California',
  'EU-CENTRAL-1': 'EU Central - Frankfurt',
  'EU-WEST-1': 'EU West - London',
};

export default function OrderPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const [configuration, setConfiguration] = useState<VPSConfiguration | null>(null);
  const [pricing, setPricing] = useState<Pricing | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    // Load configuration from session storage
    const savedConfig = sessionStorage.getItem('vpsConfiguration');
    const savedPricing = sessionStorage.getItem('vpsPricing');

    if (savedConfig && savedPricing) {
      setConfiguration(JSON.parse(savedConfig));
      setPricing(JSON.parse(savedPricing));
    } else {
      // No configuration found, redirect to configure page
      router.push('/configure');
    }
  }, [isLoading, isAuthenticated, router]);

  const handlePlaceOrder = async () => {
    if (!configuration || !pricing) return;

    setIsSubmitting(true);
    try {
      // TODO: Implement actual order placement API call
      console.log('Placing order:', { configuration, pricing });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Clear session storage
      sessionStorage.removeItem('vpsConfiguration');
      sessionStorage.removeItem('vpsPricing');

      // Redirect to orders page
      router.push('/orders?success=true');
    } catch (error) {
      console.error('Order placement failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !configuration || !pricing) {
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
                  Review Order
                </a>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                {user.firstName} {user.lastName}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Order Progress */}
          <div className="mb-8">
            <nav aria-label="Progress">
              <ol role="list" className="flex items-center">
                <li className="relative">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center">
                      <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="ml-2 text-sm font-medium text-gray-900">Configure</span>
                  </div>
                </li>
                <li className="relative">
                  <div className="flex items-center">
                    <div className="absolute left-0 top-4 h-0.5 w-full bg-primary-600"></div>
                    <div className="relative h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center">
                      <span className="text-white text-sm font-medium">2</span>
                    </div>
                    <span className="ml-2 text-sm font-medium text-gray-900">Review Order</span>
                  </div>
                </li>
                <li className="relative">
                  <div className="flex items-center">
                    <div className="absolute left-0 top-4 h-0.5 w-full bg-gray-300"></div>
                    <div className="relative h-8 w-8 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center">
                      <span className="text-gray-500 text-sm font-medium">3</span>
                    </div>
                    <span className="ml-2 text-sm font-medium text-gray-500">Payment</span>
                  </div>
                </li>
              </ol>
            </nav>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Order Details */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-medium text-gray-900">Order Summary</h3>
                </CardHeader>
                <CardBody>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Specifications</h4>
                        <dl className="mt-2 space-y-1">
                          <div className="flex justify-between text-sm">
                            <dt className="text-gray-600">CPU Cores:</dt>
                            <dd className="font-medium">{configuration.cpuCores}</dd>
                          </div>
                          <div className="flex justify-between text-sm">
                            <dt className="text-gray-600">RAM:</dt>
                            <dd className="font-medium">{configuration.ramGb} GB</dd>
                          </div>
                          <div className="flex justify-between text-sm">
                            <dt className="text-gray-600">Storage:</dt>
                            <dd className="font-medium">{configuration.storageGb} GB</dd>
                          </div>
                          <div className="flex justify-between text-sm">
                            <dt className="text-gray-600">Operating System:</dt>
                            <dd className="font-medium">{configuration.operatingSystem}</dd>
                          </div>
                        </dl>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Location</h4>
                        <p className="mt-2 text-sm text-gray-600">
                          {datacenters[configuration.datacenterLocation]}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Billing Information */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-medium text-gray-900">Billing Information</h3>
                </CardHeader>
                <CardBody>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Billing Email
                      </label>
                      <input
                        type="email"
                        value={user.email}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          First Name
                        </label>
                        <input
                          type="text"
                          value={user.firstName || ''}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Last Name
                        </label>
                        <input
                          type="text"
                          value={user.lastName || ''}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900"
                        />
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Terms and Conditions */}
              <Card>
                <CardBody>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">
                        Terms of Service
                      </h4>
                      <div className="bg-gray-50 p-4 rounded-lg max-h-32 overflow-y-auto">
                        <p className="text-xs text-gray-600">
                          By placing this order, you agree to our Terms of Service and Privacy Policy.
                          You understand that this is a monthly recurring service and you will be billed
                          automatically each month. You can cancel your service at any time.
                        </p>
                      </div>
                    </div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        defaultChecked={true}
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        I agree to the Terms of Service and Privacy Policy
                      </span>
                    </label>
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* Payment Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-6">
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-medium text-gray-900">Payment Summary</h3>
                  </CardHeader>
                  <CardBody>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">CPU ({configuration.cpuCores} cores)</span>
                        <span className="font-medium">${pricing.breakdown.cpu.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">RAM ({configuration.ramGb} GB)</span>
                        <span className="font-medium">${pricing.breakdown.ram.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Storage ({configuration.storageGb} GB)</span>
                        <span className="font-medium">${pricing.breakdown.storage.toFixed(2)}</span>
                      </div>
                      {pricing.breakdown.operatingSystem > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Windows License</span>
                          <span className="font-medium">${pricing.breakdown.operatingSystem.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="border-t pt-3">
                        <div className="flex justify-between">
                          <span className="text-lg font-bold text-gray-900">Total Monthly</span>
                          <span className="text-lg font-bold text-primary-600">
                            ${pricing.totalPrice.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardBody>
                  <CardFooter>
                    <Button
                      onClick={handlePlaceOrder}
                      fullWidth
                      disabled={isSubmitting}
                      isLoading={isSubmitting}
                      className="text-base"
                    >
                      {isSubmitting ? 'Placing Order...' : 'Place Order'}
                    </Button>
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center text-xs text-gray-500">
                        <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                        Secure payment processing
                      </div>
                      <div className="flex items-center text-xs text-gray-500">
                        <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        30-day money-back guarantee
                      </div>
                    </div>
                  </CardFooter>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}