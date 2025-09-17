//submit report
import React, { useState, useEffect } from 'react';
import { HazardReport } from '@/entities/HazardReport';
import { User } from '@/entities/User';
import { UploadFile, InvokeLLM } from '@/integrations/Core';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  MapPin, 
  Upload, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  Camera,
  Navigation
} from 'lucide-react';

export default function SubmitReport() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    hazard_type: '',
    severity: 'moderate',
    latitude: '',
    longitude: '',
    location_name: ''
  });
  const [mediaFiles, setMediaFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const getCurrentLocation = () => {
    setLocationLoading(true);
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.');
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setFormData(prev => ({
          ...prev,
          latitude: latitude.toString(),
          longitude: longitude.toString()
        }));

        // Try to get location name using reverse geocoding
        try {
          const response = await fetch(
            `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=YOUR_API_KEY&no_annotations=1`
          );
          if (response.ok) {
            const data = await response.json();
            if (data.results && data.results[0]) {
              setFormData(prev => ({
                ...prev,
                location_name: data.results[0].formatted
              }));
            }
          }
        } catch (error) {
          // Fallback to generic location name
          setFormData(prev => ({
            ...prev,
            location_name: `Location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
          }));
        }
        
        setLocationLoading(false);
      },
      (error) => {
        setError('Unable to retrieve your location. Please enter coordinates manually.');
        setLocationLoading(false);
      }
    );
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setMediaFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

  const calculateUrgencyScore = async (description, hazardType, severity) => {
    try {
      const response = await InvokeLLM({
        prompt: `Analyze this coastal hazard report and calculate an urgency score from 1-10 based on:
        - Description: "${description}"
        - Hazard type: ${hazardType}
        - Reported severity: ${severity}
        
        Consider factors like immediate danger to people, infrastructure impact, environmental damage, and time sensitivity. Return only a number between 1-10.`,
        response_json_schema: {
          type: "object",
          properties: {
            urgency_score: { type: "number", minimum: 1, maximum: 10 },
            reasoning: { type: "string" }
          }
        }
      });
      return response.urgency_score || 5;
    } catch (error) {
      return 5; // Default score if AI analysis fails
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Upload media files
      const mediaUrls = [];
      for (const file of mediaFiles) {
        const { file_url } = await UploadFile({ file });
        mediaUrls.push(file_url);
      }

      // Calculate urgency score
      const urgencyScore = await calculateUrgencyScore(
        formData.description,
        formData.hazard_type,
        formData.severity
      );

      // Create report
      await HazardReport.create({
        ...formData,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        media_urls: mediaUrls,
        urgency_score: urgencyScore,
        social_media_mentions: 0
      });

      setSuccess(true);
      setTimeout(() => {
        navigate(createPageUrl('Dashboard'));
      }, 2000);

    } catch (error) {
      setError('Failed to submit report. Please try again.');
      console.error('Error submitting report:', error);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <Card className="text-center p-8">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Report Submitted!</h2>
          <p className="text-gray-600 mb-4">
            Your hazard report has been submitted and will be reviewed by authorities.
          </p>
          <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          Submit Hazard Report
        </h1>
        <p className="text-gray-600">
          Report coastal hazards to help protect your community
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Report Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Report Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Brief description of the hazard"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="hazard_type">Hazard Type *</Label>
                <Select 
                  value={formData.hazard_type} 
                  onValueChange={(value) => setFormData({ ...formData, hazard_type: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select hazard type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tsunami">🌊 Tsunami</SelectItem>
                    <SelectItem value="storm_surge">🌀 Storm Surge</SelectItem>
                    <SelectItem value="high_waves">〰️ High Waves</SelectItem>
                    <SelectItem value="coastal_flooding">💧 Coastal Flooding</SelectItem>
                    <SelectItem value="erosion">🏔️ Coastal Erosion</SelectItem>
                    <SelectItem value="abnormal_sea_behavior">⚠️ Abnormal Sea Behavior</SelectItem>
                    <SelectItem value="other">❗ Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="severity">Severity Level</Label>
                <Select 
                  value={formData.severity} 
                  onValueChange={(value) => setFormData({ ...formData, severity: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">🟢 Low</SelectItem>
                    <SelectItem value="moderate">🟡 Moderate</SelectItem>
                    <SelectItem value="high">🟠 High</SelectItem>
                    <SelectItem value="critical">🔴 Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Detailed Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what you observed, when it happened, and any immediate impacts..."
                rows={4}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Location Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Location Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3 mb-4">
              <Button
                type="button"
                onClick={getCurrentLocation}
                disabled={locationLoading}
                className="flex items-center gap-2"
              >
                {locationLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Navigation className="w-4 h-4" />
                )}
                Use Current Location
              </Button>
            </div>

            <div>
              <Label htmlFor="location_name">Location Name</Label>
              <Input
                id="location_name"
                value={formData.location_name}
                onChange={(e) => setFormData({ ...formData, location_name: e.target.value })}
                placeholder="e.g., Marina Beach, Chennai"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="latitude">Latitude *</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  placeholder="e.g., 13.0827"
                  required
                />
              </div>
              <div>
                <Label htmlFor="longitude">Longitude *</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  placeholder="e.g., 80.2707"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Media Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Photos & Videos (Optional)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-4">
                Upload photos or videos to support your report
              </p>
              <input
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                id="media-upload"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('media-upload').click()}
              >
                Choose Files
              </Button>
            </div>

            {mediaFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                {mediaFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-600">{file.name}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeFile(index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-end gap-4 pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(createPageUrl('Dashboard'))}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading || !formData.title || !formData.hazard_type || !formData.latitude || !formData.longitude}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Report'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
