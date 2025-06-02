import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Truck, Warehouse, User, Users, Store } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi, LogisticDailyStat, DailyStat, StatisticsDTO } from '@/lib/api';

const Dashboard = () => {
  // Fetch statistics
  const { data: statistics, isLoading: isLoadingStats } = useQuery({
    queryKey: ['dashboard-statistics'],
    queryFn: async () => {
      const response = await dashboardApi.getStatistics();
      return response.data;
    }
  });

  // Fetch logistics stats
  const { data: logisticsStats, isLoading: isLoadingLogistics } = useQuery({
    queryKey: ['logistics-stats'],
    queryFn: async () => {
      const response = await dashboardApi.getLogisticsStats();
      // Sort data by date in ascending order
      return response.data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }
  });

  // Fetch weekly orders and purchases stats
  const { data: weeklyStats, isLoading: isLoadingWeeklyStats } = useQuery({
    queryKey: ['weekly-stats'],
    queryFn: async () => {
      const response = await dashboardApi.getWeeklyOrdersAndPurchases();
      // Sort data by date in ascending order
      return response.data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }
  });

  // Stats cards data
  const statsData = [
    { 
      title: 'Total Users', 
      value: isLoadingStats ? '...' : statistics?.userCount.toString() || '0', 
      icon: Users, 
      color: 'bg-blue-100 text-blue-600' 
    },
    { 
      title: 'Total Clients', 
      value: isLoadingStats ? '...' : statistics?.clientCount.toString() || '0', 
      icon: User, 
      color: 'bg-purple-100 text-purple-600' 
    },
    { 
      title: 'Total Suppliers', 
      value: isLoadingStats ? '...' : statistics?.supplierCount.toString() || '0', 
      icon: Store, 
      color: 'bg-amber-100 text-amber-600' 
    },
    { 
      title: 'Total Warehouses', 
      value: isLoadingStats ? '...' : statistics?.warehouseCount.toString() || '0', 
      icon: Warehouse, 
      color: 'bg-green-100 text-green-600' 
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Updated {new Date().toLocaleDateString()}
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsData.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-bold">{stat.value}</p>
                </div>
                <div className={`rounded-full p-2 ${stat.color}`}>
                  <stat.icon size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Logistics Activity Chart */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Logistics Activity (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <ResponsiveContainer width="100%" height={300}>
              {isLoadingLogistics ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">Loading statistics...</p>
                </div>
              ) : logisticsStats ? (
                <LineChart data={logisticsStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#9ca3af"
                    tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip
                    labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { 
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="nb_shipments"
                    name="Shipments"
                    stroke="#0ea5e9"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 8 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="nb_transfers"
                    name="Transfers"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="nb_receptions"
                    name="Receptions"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">No data available</p>
                </div>
              )}
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Orders and Purchases Chart */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Orders & Purchases (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <ResponsiveContainer width="100%" height={300}>
              {isLoadingWeeklyStats ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">Loading statistics...</p>
                </div>
              ) : weeklyStats ? (
                <LineChart data={weeklyStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#9ca3af"
                    tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip
                    labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { 
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="nbr_orders"
                    name="Orders"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 8 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="nbr_purchases"
                    name="Purchases"
                    stroke="#ec4899"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">No data available</p>
                </div>
              )}
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
