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
import { DownloadIcon, UploadIcon, Trash2Icon } from 'lucide-react';
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
  const [soundEnabled, setSoundEnabled] = useState(true); // Placeholder
  const [notificationsEnabled, setNotificationsEnabled] = useState(false); // Placeholder
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Placeholder for future theme toggle
  // const [theme, setTheme] = useState('system'); 

  useEffect(() => {
    // Load settings from localStorage if they exist
    const storedSound = localStorage.getItem('zenithTimerSoundEnabled');
    if (storedSound) setSoundEnabled(JSON.parse(storedSound));
    
    // For actual browser notifications, you'd check Notification.permission
    // This is just a UI state for now.
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
    // Here you would also request/manage browser notification permissions
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
        
        // Basic validation
        if (!Array.isArray(importedTimers) || !importedTimers.every(t => t.id && t.name && Array.isArray(t.segments))) {
            throw new Error("Invalid file format.");
        }

        // Merge or replace logic (here, replacing for simplicity)
        localStorage.setItem(LOCAL_STORAGE_CUSTOM_TIMERS_KEY, JSON.stringify(importedTimers));
        toast({ title: "Import Successful", description: `${importedTimers.length} custom timer(s) imported. Please refresh if you don't see them immediately on the templates page.` });
        // Force reload or update state elsewhere if needed
      } catch (error) {
        console.error("Import failed:", error);
        toast({ title: "Import Failed", description: `Could not import timers. Error: ${(error as Error).message}`, variant: "destructive" });
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset file input
  };

  const handleClearAllCustomTimers = () => {
    localStorage.removeItem(LOCAL_STORAGE_CUSTOM_TIMERS_KEY);
    toast({ title: "All Custom Timers Cleared", description: "Your custom timer configurations have been removed." });
    setShowClearConfirm(false);
    // Potentially redirect or refresh parts of the app using these timers
  };


  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-primary mb-8">Settings</h1>
      
      <div className="space-y-8 max-w-2xl">
        <Card className="bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl">General Settings</CardTitle>
            <CardDescription>Manage app-wide preferences.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <Label htmlFor="sound-toggle" className="text-lg">Enable Sound Notifications</Label>
              <Switch id="sound-toggle" checked={soundEnabled} onCheckedChange={handleSoundToggle} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="notifications-toggle" className="text-lg">Enable Browser Notifications</Label>
              <Switch id="notifications-toggle" checked={notificationsEnabled} onCheckedChange={handleNotificationsToggle} />
            </div>
            {/* Placeholder for Theme Toggle
            <div className="flex items-center justify-between">
              <Label htmlFor="theme-select" className="text-lg">Theme</Label>
               <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger id="theme-select" className="w-[180px]">
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
             */}
          </CardContent>
        </Card>

        <Card className="bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Timer Data Management</CardTitle>
            <CardDescription>Export, import, or clear your custom timer configurations.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleExportTimers} variant="outline" className="w-full justify-start">
              <DownloadIcon className="mr-2 h-5 w-5" /> Export Custom Timers
            </Button>
            <div>
              <Label htmlFor="import-file" className="block mb-2 text-sm font-medium text-foreground">Import Custom Timers (JSON)</Label>
              <Input id="import-file" type="file" accept=".json" onChange={handleImportTimers} className="w-full file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90" />
            </div>
             <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full justify-start">
                        <Trash2Icon className="mr-2 h-5 w-5" /> Clear All Custom Timers
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

        {/* Add more settings sections as needed */}
      </div>
    </div>
  );
}
