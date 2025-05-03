
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Truck, Warehouse, User } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from 'recharts';

// Mock data
const statsData = [
  { title: 'Total Users', value: '24', icon: User, color: 'bg-blue-100 text-blue-600' },
  { title: 'Warehouses', value: '8', icon: Warehouse, color: 'bg-purple-100 text-purple-600' },
  { title: 'Active Orders', value: '142', icon: Package, color: 'bg-amber-100 text-amber-600' },
  { title: 'Shipments Today', value: '17', icon: Truck, color: 'bg-green-100 text-green-600' },
];

const chartData = [
  { name: 'Jan', orders: 65, shipments: 45 },
  { name: 'Feb', orders: 78, shipments: 52 },
  { name: 'Mar', orders: 82, shipments: 70 },
  { name: 'Apr', orders: 70, shipments: 65 },
  { name: 'May', orders: 85, shipments: 75 },
  { name: 'Jun', orders: 90, shipments: 85 },
];

const Dashboard = () => {
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
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Activity Overview</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="orders"
                  stroke="#0ea5e9"
                  activeDot={{ r: 8 }}
                />
                <Line type="monotone" dataKey="shipments" stroke="#8b5cf6" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Warehouse Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {['Central Warehouse', 'East Storage', 'West Depot', 'South Facility'].map((warehouse, i) => {
                const percentage = [87, 65, 92, 42][i];
                return (
                  <div key={warehouse} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{warehouse}</span>
                      <span className="text-sm font-medium">{percentage}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          percentage > 80 ? 'bg-red-500' : percentage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
