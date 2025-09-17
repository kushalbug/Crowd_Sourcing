//ReportCard

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { 
  MapPin, 
  Clock, 
  User, 
  Eye, 
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowUp
} from 'lucide-react';

const hazardIcons = {
  tsunami: '🌊',
  storm_surge: '🌀', 
  high_waves: '〰️',
  coastal_flooding: '💧',
  erosion: '🏔️',
  abnormal_sea_behavior: '⚠️',
  other: '❗'
};

const statusIcons = {
  pending: Clock,
  verified: CheckCircle,
  dismissed: XCircle,
  escalated: ArrowUp
};

export default function ReportCard({ report, onSelect, showActions = false, onStatusChange }) {
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-800';
      case 'dismissed': return 'bg-gray-100 text-gray-800';
      case 'escalated': return 'bg-red-100 text-red-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const StatusIcon = statusIcons[report.status] || Clock;

  return (
    <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{hazardIcons[report.hazard_type]}</span>
            <div>
              <h3 className="font-semibold text-lg">{report.title}</h3>
              <p className="text-sm text-gray-600 capitalize">
                {report.hazard_type.replace('_', ' ')}
              </p>
            </div>
          </div>
          <Badge className={getSeverityColor(report.severity)}>
            {report.severity.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <p className="text-gray-700 text-sm leading-relaxed">
          {report.description}
        </p>
        
        <div className="grid grid-cols-2 gap-3 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            <span>{report.location_name || 'Unknown location'}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{format(new Date(report.created_date), 'MMM d, h:mm a')}</span>
          </div>
          <div className="flex items-center gap-1">
            <User className="w-3 h-3" />
            <span>{report.created_by}</span>
          </div>
          <div className="flex items-center gap-1">
            <StatusIcon className="w-3 h-3" />
            <span className="capitalize">{report.status}</span>
          </div>
        </div>

        {(report.urgency_score || report.social_media_mentions > 0) && (
          <div className="flex items-center gap-4 pt-2 border-t">
            {report.urgency_score && (
              <div className="flex items-center gap-1 text-xs">
                <AlertTriangle className="w-3 h-3 text-orange-500" />
                <span>Urgency: {report.urgency_score}/10</span>
              </div>
            )}
            {report.social_media_mentions > 0 && (
              <div className="flex items-center gap-1 text-xs">
                <MessageSquare className="w-3 h-3 text-blue-500" />
                <span>{report.social_media_mentions} mentions</span>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <Badge variant="outline" className={getStatusColor(report.status)}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {report.status.toUpperCase()}
          </Badge>
          
          <div className="flex gap-2">
            {report.media_urls && report.media_urls.length > 0 && (
              <Button size="sm" variant="outline" className="text-xs">
                <Eye className="w-3 h-3 mr-1" />
                Media
              </Button>
            )}
            <Button 
              size="sm" 
              onClick={() => onSelect(report)}
              className="text-xs bg-blue-600 hover:bg-blue-700"
            >
              View Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
