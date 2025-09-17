//Analytics

import React, { useState, useEffect } from 'react';
import { HazardReport } from '@/entities/HazardReport';
import { User } from '@/entities/User';
import { InvokeLLM } from '@/integrations/Core';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  TrendingUp, 
  AlertTriangle, 
  MessageSquare, 
  Users,
  RefreshCw,
  Brain,
  Globe
} from 'lucide-react';

const COLORS = ['#3B82F6', '#EF4444', '#F59E0B', '#10B981', '#8B5CF6'];

export default function Analytics() {
  const [reports, setReports] = useState([]);
  const [user, setUser] = useState(null);
  const [socialAnalysis, setSocialAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [reportsData, userData] = await Promise.all([
        HazardReport.list('-created_date', 200),
        User.me()
      ]);
      setReports(reportsData);
      setUser(userData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setLoading(false);
  };

  const runSocialMediaAnalysis = async () => {
    setAnalysisLoading(true);
    try {
      const recentReports = reports.slice(0, 10).map(r => 
        `${r.hazard_type}: ${r.title} at ${r.location_name} (${r.severity})`
      ).join('\n');

      const analysis = await InvokeLLM({
        prompt: `Analyze these recent coastal hazard reports and simulate what social media analysis might show:

Recent reports:
${recentReports}

Simulate realistic social media analysis including:
1. Trending hazard keywords and hashtags
2. Sentiment analysis of public reactions
3. Geographic hotspots of social media activity
4. Estimated reach and engagement metrics
5. Key influencer mentions and emergency response accounts
6. Public concern levels and misinformation risks

Make it realistic for India's coastal regions and current social media patterns.`,
        response_json_schema: {
          type: "object",
          properties: {
            trending_keywords: {
              type: "array",
              items: { type: "string" }
            },
            sentiment_breakdown: {
              type: "object",
              properties: {
                concerned: { type: "number" },
                neutral: { type: "number" },
                panic: { type: "number" }
              }
            },
            geographic_hotspots: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  location: { type: "string" },
                  mention_count: { type: "number" },
                  sentiment: { type: "string" }
                }
              }
            },
            engagement_metrics: {
              type: "object",
              properties: {
                total_posts: { type: "number" },
                total_reach: { type: "number" },
                avg_engagement_rate: { type: "number" }
              }
            },
            misinformation_risk: {
              type: "string",
              enum: ["low", "moderate", "high"]
            }
          }
        }
      });

      setSocialAnalysis(analysis);
    } catch (error) {
      console.error('Error running social media analysis:', error);
    }
    setAnalysisLoading(false);
  };

  const getHazardTypeData = () => {
    const counts = {};
    reports.forEach(report => {
      counts[report.hazard_type] = (counts[report.hazard_type] || 0) + 1;
    });
    
    return Object.entries(counts).map(([type, count]) => ({
      name: type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value: count,
      count: count
    }));
  };

  const getSeverityData = () => {
    const counts = { low: 0, moderate: 0, high: 0, critical: 0 };
    reports.forEach(report => {
      counts[report.severity] = (counts[report.severity] || 0) + 1;
    });
    
    return Object.entries(counts).map(([severity, count]) => ({
      name: severity.charAt(0).toUpperCase() + severity.slice(1),
      value: count
    }));
  };

  const getTimelineData = () => {
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayReports = reports.filter(report => 
        report.created_date.startsWith(dateStr)
      );
      
      last7Days.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        reports: dayReports.length,
        high_severity: dayReports.filter(r => r.severity === 'high' || r.severity === 'critical').length
      });
    }
    
    return last7Days;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="grid grid-cols-3 gap-4">
            {[1,2,3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Only allow officials and analysts
  if (user?.role === 'citizen') {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <Card className="text-center p-8">
          <AlertTriangle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h2>
          <p className="text-gray-600">
            Analytics dashboard is only available for officials and analysts.
          </p>
        </Card>
      </div>
    );
  }

  const hazardTypeData = getHazardTypeData();
  const severityData = getSeverityData();
  const timelineData = getTimelineData();

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Analytics Dashboard
          </h1>
          <p className="text-gray-600">Advanced insights and social media monitoring</p>
        </div>
        <Button onClick={loadData} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Reports</p>
                <p className="text-2xl font-bold">{reports.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">High Priority</p>
                <p className="text-2xl font-bold">
                  {reports.filter(r => r.severity === 'high' || r.severity === 'critical').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Social Mentions</p>
                <p className="text-2xl font-bold">
                  {reports.reduce((sum, r) => sum + (r.social_media_mentions || 0), 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Avg Urgency</p>
                <p className="text-2xl font-bold">
                  {(reports.reduce((sum, r) => sum + (r.urgency_score || 5), 0) / reports.length).toFixed(1)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="social">Social Media</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Hazard Types */}
            <Card>
              <CardHeader>
                <CardTitle>Reports by Hazard Type</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={hazardTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {hazardTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Severity Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Severity Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={severityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Reports Timeline (Last 7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="reports" stroke="#3B82F6" strokeWidth={2} />
                  <Line type="monotone" dataKey="high_severity" stroke="#EF4444" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                Social Media Analysis
                <Button 
                  onClick={runSocialMediaAnalysis}
                  disabled={analysisLoading}
                  size="sm"
                  className="ml-auto"
                >
                  {analysisLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Globe className="w-4 h-4 mr-2" />
                      Run Analysis
                    </>
                  )}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!socialAnalysis ? (
                <div className="text-center py-8 text-gray-500">
                  Click "Run Analysis" to simulate social media monitoring
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Sentiment Breakdown */}
                  <div>
                    <h3 className="font-semibold mb-3">Public Sentiment</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Concerned</span>
                        <span>{socialAnalysis.sentiment_breakdown?.concerned || 0}%</span>
                      </div>
                      <Progress value={socialAnalysis.sentiment_breakdown?.concerned || 0} className="h-2" />
                      
                      <div className="flex justify-between text-sm">
                        <span>Neutral</span>
                        <span>{socialAnalysis.sentiment_breakdown?.neutral || 0}%</span>
                      </div>
                      <Progress value={socialAnalysis.sentiment_breakdown?.neutral || 0} className="h-2" />
                      
                      <div className="flex justify-between text-sm">
                        <span>Panic</span>
                        <span>{socialAnalysis.sentiment_breakdown?.panic || 0}%</span>
                      </div>
                      <Progress value={socialAnalysis.sentiment_breakdown?.panic || 0} className="h-2 bg-red-200" />
                    </div>
                  </div>

                  {/* Trending Keywords */}
                  <div>
                    <h3 className="font-semibold mb-3">Trending Keywords</h3>
                    <div className="flex flex-wrap gap-2">
                      {socialAnalysis.trending_keywords?.map((keyword, index) => (
                        <Badge key={index} variant="outline">#{keyword}</Badge>
                      ))}
                    </div>
                  </div>

                  {/* Geographic Hotspots */}
                  <div>
                    <h3 className="font-semibold mb-3">Geographic Hotspots</h3>
                    <div className="space-y-2">
                      {socialAnalysis.geographic_hotspots?.map((hotspot, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span className="font-medium">{hotspot.location}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{hotspot.mention_count} mentions</Badge>
                            <Badge className={
                              hotspot.sentiment === 'concerned' ? 'bg-orange-100 text-orange-800' :
                              hotspot.sentiment === 'panic' ? 'bg-red-100 text-red-800' :
                              'bg-blue-100 text-blue-800'
                            }>
                              {hotspot.sentiment}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Misinformation Risk */}
                  <div>
                    <h3 className="font-semibold mb-2">Misinformation Risk</h3>
                    <Badge className={
                      socialAnalysis.misinformation_risk === 'high' ? 'bg-red-100 text-red-800' :
                      socialAnalysis.misinformation_risk === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }>
                      {socialAnalysis.misinformation_risk?.toUpperCase()} RISK
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Locations by Report Frequency</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {reports.slice(0, 10).map((report, index) => (
                  <div key={report.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div>
                      <span className="font-medium">{report.location_name || 'Unknown'}</span>
                      <Badge className="ml-2" variant="outline">{report.hazard_type}</Badge>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      Urgency: {report.urgency_score}/10
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
