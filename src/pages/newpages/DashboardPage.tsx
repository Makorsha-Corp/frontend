import React from 'react';
import DashboardNavbar, { SIDEBAR_COLLAPSED_KEY } from '@/components/newcomponents/customui/DashboardNavbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, TrendingUp, DollarSign, Users as UsersIcon, Activity, Percent } from 'lucide-react';
import { useAppSelector } from '@/app/hooks';

const DashboardPage: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const [isNavCollapsed, setIsNavCollapsed] = React.useState(() =>
    localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true'
  );

  const stats = [
    { title: 'Current MRR', value: '—', bgColor: 'bg-brand-primary', icon: <DollarSign size={24} /> },
    { title: 'Current Customers', value: '—', bgColor: 'bg-brand-primary-hover', icon: <UsersIcon size={24} /> },
    { title: 'Active Customers', value: '—', bgColor: 'bg-brand-accent', icon: <Activity size={24} />, textDark: true },
    { title: 'Churn Rate', value: '—', bgColor: 'bg-card', border: true, icon: <Percent size={24} />, textDark: true },
  ];

  const transactions: { name: string; badge: string; amount: string; status: string }[] = [];
  const supportTickets: { email: string; issue: string; status: string; color: string }[] = [];

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardNavbar onCollapsedChange={setIsNavCollapsed} />
      
      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${isNavCollapsed ? 'ml-20' : 'ml-64'}`}>
        {/* Top Bar */}
        <div className="bg-card dark:bg-[hsl(var(--nav-background))] border-b border-border dark:border-border px-8 py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-card-foreground dark:text-foreground">Dashboard</h1>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground dark:text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search transactions, customers, subscriptions..."
                  className="pl-10 pr-4 py-2 w-96 border border-border rounded-lg bg-background dark:bg-background/50 text-foreground focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                />
              </div>
              <div className="w-10 h-10 bg-brand-primary rounded-full flex items-center justify-center text-white font-semibold">
                {user?.name?.charAt(0) || 'U'}
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="p-8 bg-background">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <Card 
                key={index} 
                className={`${stat.bgColor} ${stat.border ? 'border-2 border-brand-accent' : ''} ${
                  stat.textDark ? '' : 'text-white'
                }`}
              >
                <CardHeader className="pb-3">
                  <CardTitle className={`text-sm font-medium ${stat.textDark ? 'text-card-foreground/60' : 'text-white/80'}`}>
                    {stat.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className={`text-3xl font-bold ${stat.textDark ? 'text-card-foreground' : 'text-white'}`}>
                      {stat.value}
                    </div>
                    <div className={`${stat.textDark ? 'text-card-foreground' : 'text-white/60'}`}>
                      {stat.icon}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts and Data Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Trend Chart */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-card-foreground">Trend</CardTitle>
                <div className="flex gap-2 mt-2">
                  <span className="text-xs px-2 py-1 bg-muted rounded">NEW</span>
                  <span className="text-xs px-2 py-1 bg-muted rounded">RENEWALS</span>
                  <span className="text-xs px-2 py-1 bg-brand-secondary text-white rounded">CHURNS</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-end justify-around gap-2">
                  {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'].map((month, i) => {
                    const heights = [40, 60, 45, 70, 85, 55, 75];
                    return (
                      <div key={month} className="flex-1 flex flex-col items-center gap-2">
                        <div className="w-full bg-brand-accent rounded-t" style={{ height: `${heights[i]}%` }}></div>
                        <span className="text-xs text-muted-foreground">{month}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Sales Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-card-foreground">Sales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-48">
                  <div className="relative w-40 h-40 rounded-full bg-gradient-to-br from-brand-primary via-brand-primary-hover to-brand-accent flex items-center justify-center">
                    <div className="w-24 h-24 bg-card rounded-full flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-card-foreground">342</div>
                        <div className="text-xs text-muted-foreground">SALES</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-brand-primary rounded-full"></div>
                    <span>BASIC PLAN</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-brand-primary-hover rounded-full"></div>
                    <span>PRO PLAN</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-brand-accent rounded-full"></div>
                    <span>ADVANCED PLAN</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-muted rounded-full"></div>
                    <span>ENTERPRISE PLAN</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bottom Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Transactions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-card-foreground">Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {transactions.length === 0 ? (
                    <p className="py-8 text-center text-muted-foreground text-sm">No transactions yet</p>
                  ) : (
                    transactions.map((transaction, index) => (
                      <div key={index} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-brand-primary/10 rounded-full flex items-center justify-center text-brand-primary font-semibold text-sm">
                            {transaction.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium text-card-foreground">{transaction.name}</div>
                            <div className="text-xs text-muted-foreground">{transaction.badge}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-card-foreground">{transaction.amount}</span>
                          {transaction.status === 'up' && <TrendingUp size={16} className="text-green-500" />}
                        </div>
                      </div>
                    ))
                  )}
                  <button className="w-full mt-4 py-2 text-brand-primary hover:bg-brand-primary/5 rounded-lg font-medium transition-colors">
                    View all transactions
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Support Tickets */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-card-foreground">Support Tickets</CardTitle>
                  <div className="flex gap-2">
                    <button className="text-xs px-3 py-1 bg-muted rounded-full">All</button>
                    <button className="text-xs px-3 py-1 bg-muted rounded-full">Open</button>
                    <button className="text-xs px-3 py-1 bg-muted rounded-full">Pending</button>
                    <button className="text-xs px-3 py-1 bg-muted rounded-full">Closed</button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {supportTickets.length === 0 ? (
                    <p className="py-8 text-center text-muted-foreground text-sm">No support tickets</p>
                  ) : (
                    supportTickets.map((ticket, index) => (
                      <div key={index} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                        <div className="flex-1 min-w-0 mr-4">
                          <div className="text-sm text-muted-foreground truncate">{ticket.email}</div>
                          <div className="text-xs font-medium text-card-foreground">{ticket.issue}</div>
                        </div>
                        <span className={`text-xs px-2 py-1 ${ticket.color} text-white rounded font-medium whitespace-nowrap`}>
                          {ticket.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
