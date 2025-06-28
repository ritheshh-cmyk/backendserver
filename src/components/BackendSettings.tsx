import React, { useState } from 'react';
import { useConnection } from '../contexts/ConnectionContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { ConnectionIndicator } from '../contexts/ConnectionContext';

export function BackendSettings() {
  const { isOnline, isConnecting, backendURL, updateBackendURL, healthCheck } = useConnection();
  const [newURL, setNewURL] = useState(backendURL);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    
    try {
      const success = await healthCheck();
      setTestResult({
        success,
        message: success ? 'Connection successful!' : 'Connection failed. Check your backend URL.'
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: `Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleUpdateURL = () => {
    if (newURL && newURL !== backendURL) {
      updateBackendURL(newURL);
    }
  };

  const commonURLs = [
    'http://localhost:10000',
    'http://127.0.0.1:10000',
    'http://192.168.1.100:10000',
    'http://10.0.0.100:10000',
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🔗 Backend Connection
            <ConnectionIndicator />
          </CardTitle>
          <CardDescription>
            Configure connection to your Ubuntu-in-Termux backend server
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Connection Status */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium">Connection Status</p>
              <p className="text-sm text-gray-600">
                {isConnecting ? 'Testing connection...' : 
                 isOnline ? 'Connected to backend' : 'Disconnected from backend'}
              </p>
            </div>
            <Badge variant={isOnline ? 'default' : 'destructive'}>
              {isOnline ? 'Online' : 'Offline'}
            </Badge>
          </div>

          {/* Backend URL Configuration */}
          <div className="space-y-2">
            <Label htmlFor="backend-url">Backend URL</Label>
            <div className="flex gap-2">
              <Input
                id="backend-url"
                value={newURL}
                onChange={(e) => setNewURL(e.target.value)}
                placeholder="http://localhost:10000"
                className="flex-1"
              />
              <Button 
                onClick={handleUpdateURL}
                disabled={!newURL || newURL === backendURL}
                size="sm"
              >
                Update
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Current: {backendURL}
            </p>
          </div>

          {/* Quick URL Presets */}
          <div className="space-y-2">
            <Label>Quick Presets</Label>
            <div className="flex flex-wrap gap-2">
              {commonURLs.map((url) => (
                <Button
                  key={url}
                  variant="outline"
                  size="sm"
                  onClick={() => setNewURL(url)}
                  className="text-xs"
                >
                  {url.replace('http://', '')}
                </Button>
              ))}
            </div>
          </div>

          {/* Test Connection */}
          <div className="space-y-2">
            <Button 
              onClick={handleTestConnection}
              disabled={isTesting || isConnecting}
              className="w-full"
            >
              {isTesting ? 'Testing...' : 'Test Connection'}
            </Button>
            
            {testResult && (
              <Alert variant={testResult.success ? 'default' : 'destructive'}>
                <AlertDescription>{testResult.message}</AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Connection Help */}
      <Card>
        <CardHeader>
          <CardTitle>📱 Mobile Connection Help</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">Ubuntu-in-Termux Backend</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Default port: <code className="bg-gray-100 px-1 rounded">10000</code></li>
              <li>• Local access: <code className="bg-gray-100 px-1 rounded">http://localhost:10000</code></li>
              <li>• Network access: <code className="bg-gray-100 px-1 rounded">http://[device-ip]:10000</code></li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Troubleshooting</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Make sure your backend is running: <code className="bg-gray-100 px-1 rounded">pm2 status</code></li>
              <li>• Check if port is accessible: <code className="bg-gray-100 px-1 rounded">curl http://localhost:10000/api/ping</code></li>
              <li>• Verify firewall settings on your device</li>
              <li>• For network access, ensure devices are on same WiFi</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Quick Commands</h4>
            <div className="bg-gray-50 p-3 rounded-lg space-y-1">
              <p className="text-xs font-mono"># Check backend status</p>
              <p className="text-xs font-mono text-blue-600">pm2 status</p>
              <p className="text-xs font-mono"># Restart backend</p>
              <p className="text-xs font-mono text-blue-600">pm2 restart all</p>
              <p className="text-xs font-mono"># View logs</p>
              <p className="text-xs font-mono text-blue-600">pm2 logs</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 