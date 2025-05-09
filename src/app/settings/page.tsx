
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { LOCAL_STORAGE_CUSTOM_TIMERS_KEY } from '@/lib/constants';
import type { TimerConfiguration } from '@/lib/types';
import { DownloadIcon, UploadIcon, Trash2Icon, PaletteIcon } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function SettingsPage() {
  const { toast } = useToast();
  const [soundEnabled, setSoundEnabled] = useState(true); 
  const [notificationsEnabled, setNotificationsEnabled] = useState(false); 
  const [showClearConfirm, setShowClearConfirm] = useState(false);


  useEffect(() => {
    const storedSound = localStorage.getItem('zenithTimerSoundEnabled');
    if (storedSound) setSoundEnabled(JSON.parse(storedSound));
    
    const storedNotifs = localStorage.getItem('zenithTimerNotificationsEnabled');
    if (storedNotifs) setNotificationsEnabled(JSON.parse(storedNotifs));
  }, []);

  const handleSoundToggle = (checked: boolean) => {
    setSoundEnabled(checked);
    localStorage.setItem('zenithTimerSoundEnabled', JSON.stringify(checked));
    toast({ title: 'Sound Settings Updated', description: `Sound notifications are now ${checked ? 'enabled' : 'disabled'}.` });
  };

  const handleNotificationsToggle = (checked: boolean) => {
    setNotificationsEnabled(checked);
    localStorage.setItem('zenithTimerNotificationsEnabled', JSON.stringify(checked));
    toast({ title: 'Notification Settings Updated', description: `Browser notifications are now ${checked ? 'enabled (permission pending)' : 'disabled'}.` });
  };
  
  const handleExportTimers = () => {
    const customTimersRaw = localStorage.getItem(LOCAL_STORAGE_CUSTOM_TIMERS_KEY);
    if (!customTimersRaw || customTimersRaw === "[]") {
      toast({ title: "No Timers to Export", description: "You haven't created any custom timers yet.", variant: "default" });
      return;
    }
    try {
      const blob = new Blob([customTimersRaw], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'zenith_timer_configs.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: "Export Successful", description: "Your custom timers have been exported." });
    } catch (error) {
      console.error("Export failed:", error);
      toast({ title: "Export Failed", description: "Could not export timers.", variant: "destructive" });
    }
  };

  const handleImportTimers = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedJson = e.target?.result as string;
        const importedTimers: TimerConfiguration[] = JSON.parse(importedJson);
        
        if (!Array.isArray(importedTimers) || !importedTimers.every(t => t.id && t.name && Array.isArray(t.segments))) {
            throw new Error("Invalid file format.");
        }

        localStorage.setItem(LOCAL_STORAGE_CUSTOM_TIMERS_KEY, JSON.stringify(importedTimers));
        toast({ title: "Import Successful", description: `${importedTimers.length} custom timer(s) imported. Please refresh if you don't see them immediately on the templates page.` });
      } catch (error) {
        console.error("Import failed:", error);
        toast({ title: "Import Failed", description: `Could not import timers. Error: ${(error as Error).message}`, variant: "destructive" });
      }
    };
    reader.readAsText(file);
    event.target.value = ''; 
  };

  const handleClearAllCustomTimers = () => {
    localStorage.removeItem(LOCAL_STORAGE_CUSTOM_TIMERS_KEY);
    toast({ title: "All Custom Timers Cleared", description: "Your custom timer configurations have been removed." });
    setShowClearConfirm(false);
  };


  return (
    <div className="container mx-auto px-2 sm:px-4 py-8">
      <h1 className="text-3xl sm:text-4xl font-bold text-primary mb-8">Settings</h1>
      
      <div className="space-y-8 max-w-2xl">
        <Card className="bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl">General Settings</CardTitle>
            <CardDescription className="text-sm sm:text-base">Manage app-wide preferences.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <Label htmlFor="sound-toggle" className="text-base sm:text-lg">Enable Sound Notifications</Label>
              <Switch id="sound-toggle" checked={soundEnabled} onCheckedChange={handleSoundToggle} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="notifications-toggle" className="text-base sm:text-lg">Enable Browser Notifications</Label>
              <Switch id="notifications-toggle" checked={notificationsEnabled} onCheckedChange={handleNotificationsToggle} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl">Timer Data Management</CardTitle>
            <CardDescription className="text-sm sm:text-base">Export, import, or clear your custom timer configurations.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleExportTimers} variant="outline" className="w-full justify-start text-sm sm:text-base">
              <DownloadIcon className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> Export Custom Timers
            </Button>
            <div>
              <Label htmlFor="import-file" className="block mb-2 text-xs sm:text-sm font-medium text-foreground">Import Custom Timers (JSON)</Label>
              <Input 
                id="import-file" 
                type="file" 
                accept=".json" 
                onChange={handleImportTimers} 
                className="w-full file:mr-2 file:py-2 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90" 
              />
            </div>
             <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full justify-start text-sm sm:text-base">
                        <Trash2Icon className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> Clear All Custom Timers
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete all your custom timer configurations from this browser.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setShowClearConfirm(false)}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearAllCustomTimers}>Yes, delete all</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>

        <Card className="bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center text-xl sm:text-2xl">
                <PaletteIcon className="mr-2 sm:mr-3 h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                Theme Customization
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Learn how to customize the visual theme of Zenith Timer.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <p className="text-sm sm:text-base text-foreground/90">
              The visual theme of Zenith Timer is defined using CSS HSL (Hue, Saturation, Lightness) 
              variables directly in the <code>src/app/globals.css</code> file.
            </p>
            <p className="text-sm sm:text-base text-foreground/90">
              To customize the theme, developers can edit these variables. Changes are typically
              reflected immediately by the development server (Hot Module Replacement) or after a page refresh.
            </p>
            <div>
              <h4 className="text-base sm:text-lg font-semibold mb-2 text-foreground">Key Theme Variables:</h4>
              <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-foreground/80 bg-muted/30 p-3 sm:p-4 rounded-md">
                <li><code>--primary: 124 28% 53%</code> (Muted Green - Primary interactive elements)</li>
                <li><code>--secondary: 180 22% 67%</code> (Soft Cyan - Secondary elements)</li>
                <li><code>--accent: 180 30% 75%</code> (Brighter Soft Cyan - Accents, highlights)</li>
                <li><code>--background: 195 28% 13%</code> (Dark Teal - Main background for components)</li>
                <li><code>--foreground: 180 20% 90%</code> (Light Cyan/Off-white - Main text color)</li>
                <li><code>--card: 195 28% 16%</code> (Slightly lighter Dark Teal - Card backgrounds)</li>
                <li><code>--border: 195 28% 22%</code> (Borders for components)</li>
                <li><code>--destructive: 0 63% 31%</code> (Destructive actions)</li>
                <li><code>--ring: 124 28% 53%</code> (Focus rings, often matches primary)</li>
              </ul>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground pt-1">
              Refer to <code>src/app/globals.css</code> for the complete list of theme variables and their current values.
              Modifying these variables allows for deep customization of the app's look and feel.
            </p>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

