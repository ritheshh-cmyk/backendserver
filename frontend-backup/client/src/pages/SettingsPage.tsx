import { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { 
  Settings, 
  Moon, 
  Sun, 
  Globe, 
  Building2, 
  DollarSign, 
  Palette,
  Save,
  RotateCcw,
  Download,
  Upload,
  Trash2,
  Bell,
  Shield,
  Database,
  Smartphone,
  Monitor,
  Clock,
  User,
  Mail
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '../contexts/AuthContext';

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage } = useLanguage();
  const { toast } = useToast();
  const { user, logout } = useAuth();
  
  const [businessName, setBusinessName] = useState("Call Me Mobiles");
  const [businessAddress, setBusinessAddress] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [currency, setCurrency] = useState("₹ (INR)");
  const [autoBackup, setAutoBackup] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [lowStockAlerts, setLowStockAlerts] = useState(true);
  const [dailyReports, setDailyReports] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState(30);
  const [dataRetention, setDataRetention] = useState(365);

  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedBusinessName = localStorage.getItem('businessName');
    const savedBusinessAddress = localStorage.getItem('businessAddress');
    const savedBusinessPhone = localStorage.getItem('businessPhone');
    const savedBusinessEmail = localStorage.getItem('businessEmail');
    const savedCurrency = localStorage.getItem('currency');
    const savedAutoBackup = localStorage.getItem('autoBackup');
    const savedNotifications = localStorage.getItem('notifications');
    const savedEmailNotifications = localStorage.getItem('emailNotifications');
    const savedLowStockAlerts = localStorage.getItem('lowStockAlerts');
    const savedDailyReports = localStorage.getItem('dailyReports');
    const savedAutoSave = localStorage.getItem('autoSave');
    const savedSessionTimeout = localStorage.getItem('sessionTimeout');
    const savedDataRetention = localStorage.getItem('dataRetention');

    if (savedBusinessName) setBusinessName(savedBusinessName);
    if (savedBusinessAddress) setBusinessAddress(savedBusinessAddress);
    if (savedBusinessPhone) setBusinessPhone(savedBusinessPhone);
    if (savedBusinessEmail) setBusinessEmail(savedBusinessEmail);
    if (savedCurrency) setCurrency(savedCurrency);
    if (savedAutoBackup !== null) setAutoBackup(savedAutoBackup === 'true');
    if (savedNotifications !== null) setNotifications(savedNotifications === 'true');
    if (savedEmailNotifications !== null) setEmailNotifications(savedEmailNotifications === 'true');
    if (savedLowStockAlerts !== null) setLowStockAlerts(savedLowStockAlerts === 'true');
    if (savedDailyReports !== null) setDailyReports(savedDailyReports === 'true');
    if (savedAutoSave !== null) setAutoSave(savedAutoSave === 'true');
    if (savedSessionTimeout) setSessionTimeout(parseInt(savedSessionTimeout));
    if (savedDataRetention) setDataRetention(parseInt(savedDataRetention));
  }, []);

  const handleSaveSettings = () => {
    // Save settings to localStorage
    localStorage.setItem('businessName', businessName);
    localStorage.setItem('businessAddress', businessAddress);
    localStorage.setItem('businessPhone', businessPhone);
    localStorage.setItem('businessEmail', businessEmail);
    localStorage.setItem('currency', currency);
    localStorage.setItem('autoBackup', autoBackup.toString());
    localStorage.setItem('notifications', notifications.toString());
    localStorage.setItem('emailNotifications', emailNotifications.toString());
    localStorage.setItem('lowStockAlerts', lowStockAlerts.toString());
    localStorage.setItem('dailyReports', dailyReports.toString());
    localStorage.setItem('autoSave', autoSave.toString());
    localStorage.setItem('sessionTimeout', sessionTimeout.toString());
    localStorage.setItem('dataRetention', dataRetention.toString());
    
    toast({
      title: "Settings Saved",
      description: "Your settings have been saved successfully.",
    });
  };

  const handleResetSettings = () => {
    setBusinessName("Call Me Mobiles");
    setBusinessAddress("");
    setBusinessPhone("");
    setBusinessEmail("");
    setCurrency("₹ (INR)");
    setAutoBackup(true);
    setNotifications(true);
    setEmailNotifications(false);
    setLowStockAlerts(true);
    setDailyReports(false);
    setAutoSave(true);
    setSessionTimeout(30);
    setDataRetention(365);
    
    toast({
      title: "Settings Reset",
      description: "Settings have been reset to default values.",
    });
  };

  const handleExportData = () => {
    try {
      const data = {
        businessInfo: {
          name: businessName,
          address: businessAddress,
          phone: businessPhone,
          email: businessEmail,
          currency: currency
        },
        settings: {
          autoBackup,
          notifications,
          emailNotifications,
          lowStockAlerts,
          dailyReports,
          autoSave,
          sessionTimeout,
          dataRetention
        },
        exportDate: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `call-me-mobiles-settings-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Data Exported",
        description: "Settings data has been exported successfully.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export settings data.",
        variant: "destructive",
      });
    }
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="flex min-h-screen bg-background">
      <div className="flex-1 lg:ml-64">
        <main className="p-4 lg:p-6 pt-16 lg:pt-6">
          <div className="max-w-6xl mx-auto space-y-6">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Settings</h1>
                <p className="text-muted-foreground">Manage your business preferences and app settings</p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  onClick={handleExportData} 
                  variant="outline" 
                  className="flex items-center gap-2 transition-all duration-200 hover:scale-105"
                >
                  <Download className="w-4 h-4" />
                  Export Settings
                </Button>
                <Button 
                  onClick={handleResetSettings} 
                  variant="outline" 
                  className="flex items-center gap-2 transition-all duration-200 hover:scale-105"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </Button>
                <Button 
                  onClick={handleSaveSettings} 
                  className="flex items-center gap-2 transition-all duration-200 hover:scale-105"
                >
                  <Save className="w-4 h-4" />
                  Save Settings
                </Button>
              </div>
            </div>

            {user && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">Current User</h3>
                <p><strong>Username:</strong> {user.username}</p>
                <p><strong>Role:</strong> {user.role}</p>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Business Settings */}
              <Card className="transition-all duration-200 hover:shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Business Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Business Name</Label>
                    <Input
                      id="businessName"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="Enter business name"
                      className="transition-all duration-200 hover:scale-105"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="businessAddress">Business Address</Label>
                    <Textarea
                      id="businessAddress"
                      value={businessAddress}
                      onChange={(e) => setBusinessAddress(e.target.value)}
                      placeholder="Enter business address"
                      rows={3}
                      className="transition-all duration-200 hover:scale-105"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="businessPhone">Phone Number</Label>
                      <Input
                        id="businessPhone"
                        value={businessPhone}
                        onChange={(e) => setBusinessPhone(e.target.value)}
                        placeholder="Enter phone number"
                        className="transition-all duration-200 hover:scale-105"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="businessEmail">Email Address</Label>
                      <Input
                        id="businessEmail"
                        type="email"
                        value={businessEmail}
                        onChange={(e) => setBusinessEmail(e.target.value)}
                        placeholder="Enter email address"
                        className="transition-all duration-200 hover:scale-105"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <div className="px-3 py-2 bg-muted rounded text-foreground font-semibold">
                      {currency}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Appearance Settings */}
              <Card className="transition-all duration-200 hover:shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="w-5 h-5" />
                    Appearance & Interface
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Dark Mode</Label>
                      <p className="text-sm text-muted-foreground">
                        Switch between light and dark themes
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleTheme}
                      className="flex items-center gap-2 transition-all duration-200 hover:scale-105"
                    >
                      {theme === 'dark' ? (
                        <>
                          <Sun className="w-4 h-4" />
                          Light
                        </>
                      ) : (
                        <>
                          <Moon className="w-4 h-4" />
                          Dark
                        </>
                      )}
                    </Button>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Language</Label>
                      <p className="text-sm text-muted-foreground">
                        Choose your preferred language
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleLanguage}
                      className="flex items-center gap-2 transition-all duration-200 hover:scale-105"
                    >
                      <Globe className="w-4 h-4" />
                      {language === 'en' ? 'English' : 'తెలుగు'}
                    </Button>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auto Save</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically save form data
                      </p>
                    </div>
                    <Switch
                      checked={autoSave}
                      onCheckedChange={setAutoSave}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Notification Settings */}
              <Card className="transition-all duration-200 hover:shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable push notifications
                      </p>
                    </div>
                    <Switch
                      checked={notifications}
                      onCheckedChange={setNotifications}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications via email
                      </p>
                    </div>
                    <Switch
                      checked={emailNotifications}
                      onCheckedChange={setEmailNotifications}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Low Stock Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified when inventory is low
                      </p>
                    </div>
                    <Switch
                      checked={lowStockAlerts}
                      onCheckedChange={setLowStockAlerts}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Daily Reports</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive daily business summaries
                      </p>
                    </div>
                    <Switch
                      checked={dailyReports}
                      onCheckedChange={setDailyReports}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* System Settings */}
              <Card className="transition-all duration-200 hover:shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    System Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auto Backup</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically backup data daily
                      </p>
                    </div>
                    <Switch
                      checked={autoBackup}
                      onCheckedChange={setAutoBackup}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      min="5"
                      max="120"
                      value={sessionTimeout}
                      onChange={(e) => setSessionTimeout(parseInt(e.target.value) || 30)}
                      className="transition-all duration-200 hover:scale-105"
                    />
                    <p className="text-xs text-muted-foreground">
                      Automatically log out after inactivity
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="dataRetention">Data Retention (days)</Label>
                    <Input
                      id="dataRetention"
                      type="number"
                      min="30"
                      max="3650"
                      value={dataRetention}
                      onChange={(e) => setDataRetention(parseInt(e.target.value) || 365)}
                      className="transition-all duration-200 hover:scale-105"
                    />
                    <p className="text-xs text-muted-foreground">
                      How long to keep transaction data
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Data Management */}
              <Card className="transition-all duration-200 hover:shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    Data Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Download className="w-5 h-5 text-foreground/60" />
                        <div>
                          <p className="font-medium">Export Data</p>
                          <p className="text-sm text-muted-foreground">Download all business data</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="transition-all duration-200 hover:scale-105">
                        Export
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Upload className="w-5 h-5 text-foreground/60" />
                        <div>
                          <p className="font-medium">Import Data</p>
                          <p className="text-sm text-muted-foreground">Restore from backup</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="transition-all duration-200 hover:scale-105">
                        Import
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Trash2 className="w-5 h-5 text-red-500" />
                        <div>
                          <p className="font-medium">Clear Data</p>
                          <p className="text-sm text-muted-foreground">Delete all business data</p>
                        </div>
                      </div>
                      <Button variant="destructive" size="sm" className="transition-all duration-200 hover:scale-105">
                        Clear
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* About & Support */}
              <Card className="transition-all duration-200 hover:shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    About & Support
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <Smartphone className="w-5 h-5 text-foreground/60" />
                      <div>
                        <p className="font-medium">Call Me Mobiles</p>
                        <p className="text-sm text-muted-foreground">Phone Repair Business Manager</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <Monitor className="w-5 h-5 text-foreground/60" />
                      <div>
                        <p className="font-medium">Version 2.0.0</p>
                        <p className="text-sm text-muted-foreground">Latest stable release</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <Clock className="w-5 h-5 text-foreground/60" />
                      <div>
                        <p className="font-medium">Last Updated</p>
                        <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <User className="w-5 h-5 text-foreground/60" />
                      <div>
                        <p className="font-medium">Support</p>
                        <p className="text-sm text-muted-foreground">Contact for assistance</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <button 
                onClick={handleLogout}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
              >
                Logout
              </button>
              
              <div className="text-sm text-gray-600">
                <p>• Real-time sync is enabled</p>
                <p>• Authentication is active</p>
                <p>• Mobile and desktop support ready</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} 