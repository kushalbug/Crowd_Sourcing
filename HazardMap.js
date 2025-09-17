//HazardMap

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { HazardReport } from '@/entities/HazardReport';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { 
  AlertTriangle, 
  Waves, 
  Wind, 
  Eye,
  ExternalLink
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';

const severityColors = {
  low: '#22c55e',
  moderate: '#f59e0b', 
  high: '#ef4444',
  critical: '#dc2626'
};

const hazardIcons = {
  tsunami: '🌊',
  storm_surge: '🌀', 
  high_waves: '〰️',
  coastal_flooding: '💧',
  erosion: '🏔️',
  abnormal_sea_behavior: '⚠️',
  other: '❗'
};

export default function HazardMap({ reports, onReportSelect, centerLat = 20.5937, centerLng = 78.9629, zoom = 5 }) {
  const [selectedReport, setSelectedReport] = useState(null);

  const handleReportClick = (report) => {
    setSelectedReport(report);
    if (onReportSelect) onReportSelect(report);
  };

  const getHotspotRadius = (mentionCount, urgency) => {
    const baseRadius = Math.max(mentionCount * 1000, 5000);
    const urgencyMultiplier = urgency ? urgency / 5 : 1;
    return Math.min(baseRadius * urgencyMultiplier, 50000);
  };

  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={zoom}
        className="w-full h-full rounded-lg"
        style={{ minHeight: '400px' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {reports.map((report) => (
          <React.Fragment key={report.id}>
            {/* Hotspot circle for high-activity areas */}
            {report.social_media_mentions > 5 && (
              <Circle
                center={[report.latitude, report.longitude]}
                radius={getHotspotRadius(report.social_media_mentions, report.urgency_score)}
                color={severityColors[report.severity]}
                fillColor={severityColors[report.severity]}
                fillOpacity={0.1}
                weight={2}
                opacity={0.3}
              />
            )}
            
            {/* Report marker */}
            <Marker 
              position={[report.latitude, report.longitude]}
              eventHandlers={{
                click: () => handleReportClick(report)
              }}
            >
              <Popup className="custom-popup">
                <div className="p-2 min-w-64">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <span className="text-xl">
                        {hazardIcons[report.hazard_type]}
                      </span>
                      {report.title}
                    </h3>
                    <Badge 
                      className={`ml-2 ${
                        report.severity === 'critical' ? 'bg-red-100 text-red-800' :
                        report.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                        report.severity === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}
                    >
                      {report.severity.toUpperCase()}
                    </Badge>
                  </div>
                  
                  <p className="text-gray-600 mb-2 text-sm">
                    {report.description}
                  </p>
                  
                  <div className="text-xs text-gray-500 space-y-1">
                    <div>📍 {report.location_name}</div>
                    <div>🕒 {format(new Date(report.created_date), 'MMM d, yyyy h:mm a')}</div>
                    <div>👤 Reported by {report.created_by}</div>
                    {report.urgency_score && (
                      <div>⚡ Urgency: {report.urgency_score}/10</div>
                    )}
                    {report.social_media_mentions > 0 && (
                      <div>💬 {report.social_media_mentions} social mentions</div>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-center mt-3">
                    <Badge variant="outline" className="text-xs">
                      {report.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                    
                    {report.media_urls && report.media_urls.length > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={() => window.open(report.media_urls[0], '_blank')}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View Media
                      </Button>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          </React.Fragment>
        ))}
      </MapContainer>
      
      {/* Map Legend */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 text-xs max-w-48 z-[1000]">
        <h4 className="font-semibold mb-2">Severity Levels</h4>
        <div className="space-y-1">
          {Object.entries(severityColors).map(([level, color]) => (
            <div key={level} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full border"
                style={{ backgroundColor: color }}
              />
              <span className="capitalize">{level}</span>
            </div>
          ))}
        </div>
        <div className="mt-2 pt-2 border-t">
          <div className="text-gray-500">Circles = Social hotspots</div>
        </div>
      </div>
    </div>
  );
}
