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

const operatingSystems = [
  { name: 'Ubuntu 22.04 LTS', price: 0 },
  { name: 'Debian 11', price: 0 },
  { name: 'CentOS Stream 9', price: 0 },
  { name: 'Windows Server 2022', price: 15 },
];

const datacenters = [
  { code: 'US-EAST-1', name: 'US East - Virginia' },
  { code: 'US-WEST-1', name: 'US West - California' },
  { code: 'EU-CENTRAL-1', name: 'EU Central - Frankfurt' },
  { code: 'EU-WEST-1', name: 'EU West - London' },
];

export default function ConfigurePage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const [configuration, setConfiguration] = useState<VPSConfiguration>({
    cpuCores: 1,
    ramGb: 1,
    storageGb: 10,
    operatingSystem: 'Ubuntu 22.04 LTS',
    datacenterLocation: 'US-EAST-1',
  });

  const [pricing, setPricing] = useState<Pricing>({
    totalPrice: 9.10,
    breakdown: {
      cpu: 5,
      ram: 4,
      storage: 1,
      operatingSystem: 0,
    },
  });

  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    calculatePrice();
  }, [configuration]);

  const calculatePrice = async () => {
    setIsCalculating(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 300));

      const cpuPrice = configuration.cpuCores * 5;
      const ramPrice = configuration.ramGb * 4;
      const storagePrice = configuration.storageGb * 0.1;
      const osPrice = operatingSystems.find(os => os.name === configuration.operatingSystem)?.price || 0;

      const totalPrice = cpuPrice + ramPrice + storagePrice + osPrice;

      setPricing({
        totalPrice: Number(totalPrice.toFixed(2)),
        breakdown: {
          cpu: cpuPrice,
          ram: ramPrice,
          storage: Number(storagePrice.toFixed(2)),
          operatingSystem: osPrice,
        },
      });
    } catch (error) {
      console.error('Price calculation failed:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleContinue = () => {
    // Store configuration in session storage for order page
    sessionStorage.setItem('vpsConfiguration', JSON.stringify(configuration));
    sessionStorage.setItem('vpsPricing', JSON.stringify(pricing));
    router.push('/order');
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
                <a href="#" className="text-primary-700 bg-primary-100 px-3 py-2 rounded-md text-sm font-medium">
                  Configure VPS
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
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Configure Your VPS</h2>
            <p className="mt-1 text-sm text-gray-600">
              Customize your virtual server specifications with real-time pricing
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Configuration Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* CPU Configuration */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-medium text-gray-900">CPU Cores</h3>
                  <p className="text-sm text-gray-600">Select the number of CPU cores for your VPS</p>
                </CardHeader>
                <CardBody>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">CPU Cores</span>
                      <span className="text-sm font-bold text-primary-600">{configuration.cpuCores} cores</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="16"
                      value={configuration.cpuCores}
                      onChange={(e) => setConfiguration(prev => ({ ...prev, cpuCores: parseInt(e.target.value) }))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>1 core</span>
                      <span>16 cores</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      ${pricing.breakdown.cpu.toFixed(2)}/month per core
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* RAM Configuration */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-medium text-gray-900">RAM</h3>
                  <p className="text-sm text-gray-600">Choose the amount of memory for your VPS</p>
                </CardHeader>
                <CardBody>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Memory</span>
                      <span className="text-sm font-bold text-primary-600">{configuration.ramGb} GB</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="64"
                      value={configuration.ramGb}
                      onChange={(e) => setConfiguration(prev => ({ ...prev, ramGb: parseInt(e.target.value) }))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>1 GB</span>
                      <span>64 GB</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      ${pricing.breakdown.ram.toFixed(2)}/month per GB
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Storage Configuration */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-medium text-gray-900">Storage</h3>
                  <p className="text-sm text-gray-600">Select the storage capacity for your VPS</p>
                </CardHeader>
                <CardBody>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Storage</span>
                      <span className="text-sm font-bold text-primary-600">{configuration.storageGb} GB</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="1000"
                      step="10"
                      value={configuration.storageGb}
                      onChange={(e) => setConfiguration(prev => ({ ...prev, storageGb: parseInt(e.target.value) }))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>10 GB</span>
                      <span>1000 GB</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      ${pricing.breakdown.storage.toFixed(2)}/month per GB
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Operating System */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-medium text-gray-900">Operating System</h3>
                  <p className="text-sm text-gray-600">Choose your preferred operating system</p>
                </CardHeader>
                <CardBody>
                  <div className="space-y-3">
                    {operatingSystems.map((os) => (
                      <label
                        key={os.name}
                        className={`
                          flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors
                          ${configuration.operatingSystem === os.name
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-300 hover:border-gray-400'
                          }
                        `}
                      >
                        <div className="flex items-center">
                          <input
                            type="radio"
                            name="operatingSystem"
                            value={os.name}
                            checked={configuration.operatingSystem === os.name}
                            onChange={(e) => setConfiguration(prev => ({ ...prev, operatingSystem: e.target.value }))}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                          />
                          <span className="ml-3 text-sm font-medium text-gray-900">{os.name}</span>
                        </div>
                        {os.price > 0 && (
                          <span className="text-sm font-medium text-primary-600">
                            +${os.price}/month
                          </span>
                        )}
                      </label>
                    ))}
                  </div>
                </CardBody>
              </Card>

              {/* Datacenter Location */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-medium text-gray-900">Datacenter Location</h3>
                  <p className="text-sm text-gray-600">Choose where your VPS will be hosted</p>
                </CardHeader>
                <CardBody>
                  <select
                    value={configuration.datacenterLocation}
                    onChange={(e) => setConfiguration(prev => ({ ...prev, datacenterLocation: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    {datacenters.map((dc) => (
                      <option key={dc.code} value={dc.code}>
                        {dc.name}
                      </option>
                    ))}
                  </select>
                </CardBody>
              </Card>
            </div>

            {/* Pricing Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-6">
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-medium text-gray-900">Price Summary</h3>
                  </CardHeader>
                  <CardBody>
                    {isCalculating ? (
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded mb-3"></div>
                        <div className="h-4 bg-gray-200 rounded mb-3"></div>
                        <div className="h-4 bg-gray-200 rounded mb-3"></div>
                        <div className="h-6 bg-gray-200 rounded"></div>
                      </div>
                    ) : (
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
                    )}
                  </CardBody>
                  <CardFooter>
                    <Button
                      onClick={handleContinue}
                      fullWidth
                      disabled={isCalculating}
                      className="text-base"
                    >
                      Continue to Order
                    </Button>
                    <p className="mt-3 text-xs text-gray-500 text-center">
                      You can review and confirm your order before payment
                    </p>
                  </CardFooter>
                </Card>

                {/* Features */}
                <Card className="mt-6">
                  <CardHeader>
                    <h4 className="text-sm font-medium text-gray-900">What's Included</h4>
                  </CardHeader>
                  <CardBody>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-center">
                        <svg className="h-4 w-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        99.9% Uptime Guarantee
                      </li>
                      <li className="flex items-center">
                        <svg className="h-4 w-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Instant Provisioning
                      </li>
                      <li className="flex items-center">
                        <svg className="h-4 w-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Free DDoS Protection
                      </li>
                      <li className="flex items-center">
                        <svg className="h-4 w-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        24/7 Support
                      </li>
                    </ul>
                  </CardBody>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          background: #667eea;
          cursor: pointer;
          border-radius: 50%;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          background: #667eea;
          cursor: pointer;
          border-radius: 50%;
          border: none;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .slider::-webkit-slider-thumb:hover {
          background: #5a67d8;
        }

        .slider::-moz-range-thumb:hover {
          background: #5a67d8;
        }
      `}</style>
    </div>
  );
}