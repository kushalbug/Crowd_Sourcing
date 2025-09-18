//dashboard

import React, { useState, useEffect, useCallback } from 'react';
import { HazardReport } from '@/entities/HazardReport';
import { User } from '@/entities/User';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertTriangle, 
  TrendingUp, 
  Users, 
  Clock,
  RefreshCw,
  Filter,
  MapPin
} from 'lucide-react';

import HazardMap from '../components/map/HazardMap';
import ReportCard from '../components/reports/ReportCard';

export default function Dashboard() {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [reportsData, userData] = await Promise.all([
        HazardReport.list('-created_date', 100),
        User.me()
      ]);
      setReports(reportsData);
      setUser(userData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setLoading(false);
  };

  const filterReports = useCallback(() => {
    let filtered = reports;
    
    if (filter !== 'all') {
      if (filter === 'critical_high') {
        filtered = reports.filter(r => r.severity === 'critical' || r.severity === 'high');
      } else if (filter === 'unverified') {
        filtered = reports.filter(r => r.status === 'pending');
      } else if (filter === 'recent') {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        filtered = reports.filter(r => new Date(r.created_date) > yesterday);
      } else {
        filtered = reports.filter(r => r.hazard_type === filter);
      }
    }
    
    setFilteredReports(filtered);
  }, [reports, filter]); // Dependencies for useCallback

  useEffect(() => {
    filterReports();
  }, [filterReports]); // Dependency array now includes the memoized filterReports

  const getStats = () => {
    const total = reports.length;
    const critical = reports.filter(r => r.severity === 'critical' || r.severity === 'high').length;
    const pending = reports.filter(r => r.status === 'pending').length;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayReports = reports.filter(r => new Date(r.created_date) >= today).length;

    return { total, critical, pending, todayReports };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Coastal Hazard Dashboard
          </h1>
          <p className="text-gray-600">Real-time monitoring of India's coastline</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={loadData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <MapPin className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Reports</p>
                <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-red-600" />
              <div>
                <p className="text-sm text-red-600 font-medium">High Severity</p>
                <p className="text-2xl font-bold text-red-900">{stats.critical}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-sm text-orange-600 font-medium">Pending</p>
                <p className="text-2xl font-bold text-orange-900">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-green-600 font-medium">Today</p>
                <p className="text-2xl font-bold text-green-900">{stats.todayReports}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="map" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:w-auto md:grid-cols-2">
          <TabsTrigger value="map">Map View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>

        <TabsContent value="map" className="space-y-4">
          <Card className="overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span>Live Hazard Map</span>
                <div className="flex gap-2">
                  <select 
                    className="text-sm border rounded px-2 py-1"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  >
                    <option value="all">All Reports</option>
                    <option value="critical_high">High Severity</option>
                    <option value="unverified">Unverified</option>
                    <option value="recent">Last 24h</option>
                    <option value="tsunami">Tsunami</option>
                    <option value="storm_surge">Storm Surge</option>
                    <option value="high_waves">High Waves</option>
                  </select>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div style={{ height: '500px' }}>
                <HazardMap 
                  reports={filteredReports} 
                  onReportSelect={setSelectedReport}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          <div className="flex flex-wrap gap-2 mb-4">
            <Button 
              variant={filter === 'all' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setFilter('all')}
            >
              All ({reports.length})
            </Button>
            <Button 
              variant={filter === 'critical_high' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setFilter('critical_high')}
            >
              High Severity ({stats.critical})
            </Button>
            <Button 
              variant={filter === 'unverified' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setFilter('unverified')}
            >
              Pending ({stats.pending})
            </Button>
            <Button 
              variant={filter === 'recent' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setFilter('recent')}
            >
              Recent
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredReports.map((report) => (
              <ReportCard 
                key={report.id} 
                report={report} 
                onSelect={setSelectedReport}
              />
            ))}
          </div>

          {filteredReports.length === 0 && (
            <Card className="p-8 text-center">
              <p className="text-gray-500">No reports match the current filter.</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
