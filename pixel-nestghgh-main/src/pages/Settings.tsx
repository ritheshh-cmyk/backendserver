import { AppLayout } from "@/components/layout/AppLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/components/theme-provider";
import {
  Settings as SettingsIcon,
  User,
  Globe,
  Moon,
  Sun,
  Monitor,
  Bell,
  Database,
  Shield,
} from "lucide-react";

export default function Settings() {
  const { t, language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            {t("settings")}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage your application preferences and account settings
          </p>
        </div>

        {/* Theme Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Theme Settings
            </CardTitle>
            <CardDescription>
              Choose your preferred color scheme
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Light Mode</Label>
                <p className="text-sm text-muted-foreground">Use light theme</p>
              </div>
              <Button
                variant={theme === "light" ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme("light")}
              >
                <Sun className="mr-2 h-4 w-4" />
                Light
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Dark Mode</Label>
                <p className="text-sm text-muted-foreground">Use dark theme</p>
              </div>
              <Button
                variant={theme === "dark" ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme("dark")}
              >
                <Moon className="mr-2 h-4 w-4" />
                Dark
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">System</Label>
                <p className="text-sm text-muted-foreground">
                  Follow system preference
                </p>
              </div>
              <Button
                variant={theme === "system" ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme("system")}
              >
                <Monitor className="mr-2 h-4 w-4" />
                System
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Language Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Language Settings
            </CardTitle>
            <CardDescription>Choose your preferred language</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">English</Label>
                <p className="text-sm text-muted-foreground">
                  Use English interface
                </p>
              </div>
              <Button
                variant={language === "en" ? "default" : "outline"}
                size="sm"
                onClick={() => setLanguage("en")}
              >
                🇺🇸 English
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">తెలుగు</Label>
                <p className="text-sm text-muted-foreground">
                  తెలుగు భాషలో ఉపయోగించండి
                </p>
              </div>
              <Button
                variant={language === "te" ? "default" : "outline"}
                size="sm"
                onClick={() => setLanguage("te")}
              >
                🇮🇳 తెలుగు
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* App Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              App Information
            </CardTitle>
            <CardDescription>Version and system details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Version
                </Label>
                <p className="text-base font-semibold">v1.0.0</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Build
                </Label>
                <p className="text-base font-semibold">#20240115.1</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Platform
                </Label>
                <p className="text-base font-semibold">
                  {navigator.platform || "Web"}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Last Updated
                </Label>
                <p className="text-base font-semibold">Jan 15, 2024</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
