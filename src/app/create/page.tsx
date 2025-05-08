'use client';

import { Suspense, useEffect, useState } from 'react';
import TimerForm from '@/components/TimerForm';
import type { TimerConfiguration } from '@/lib/types';
import { LOCAL_STORAGE_CUSTOM_TIMERS_KEY, TIMER_TEMPLATES } from '@/lib/constants';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronLeftIcon } from 'lucide-react';

function CreateTimerPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [editingConfig, setEditingConfig] = useState<TimerConfiguration | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  const editId = searchParams.get('editId');

  useEffect(() => {
    if (editId) {
      const customTimersRaw = localStorage.getItem(LOCAL_STORAGE_CUSTOM_TIMERS_KEY);
      let foundConfig: TimerConfiguration | undefined = undefined;
      if (customTimersRaw) {
        try {
          const customTimers: TimerConfiguration[] = JSON.parse(customTimersRaw);
          foundConfig = customTimers.find(t => t.id === editId);
        } catch (e) {
          console.error("Failed to parse custom timers:", e);
          toast({ title: "Error", description: "Could not load timer for editing.", variant: "destructive" });
        }
      }
      
      // Also check predefined templates if needed, though usually editing is for custom ones.
      // For this app, let's assume editId refers to custom timers only.
      // If it could be a predefined one you want to "clone and edit", logic would differ.

      if (foundConfig) {
        setEditingConfig(foundConfig);
      } else {
        toast({ title: "Not Found", description: "Timer to edit was not found.", variant: "destructive" });
        router.replace('/create'); // Go back to create new if ID is invalid
      }
    }
    setIsLoading(false);
  }, [editId, router, toast]);


  const handleSaveConfiguration = (newConfig: TimerConfiguration) => {
    const customTimersRaw = localStorage.getItem(LOCAL_STORAGE_CUSTOM_TIMERS_KEY);
    let customTimers: TimerConfiguration[] = [];
    if (customTimersRaw) {
      try {
        customTimers = JSON.parse(customTimersRaw);
      } catch (error) {
        console.error("Failed to parse custom timers, starting fresh list:", error);
        customTimers = []; // Start with empty if parsing fails
      }
    }

    if (editId) { // Editing existing
      const index = customTimers.findIndex(t => t.id === editId);
      if (index > -1) {
        customTimers[index] = newConfig;
      } else { // Should not happen if editId is valid, but as a fallback
        customTimers.push(newConfig);
      }
    } else { // Creating new
      // Ensure unique ID, though TimerForm should handle initial generation
      if (customTimers.some(t => t.id === newConfig.id) || TIMER_TEMPLATES.some(t => t.id === newConfig.id)) {
         newConfig.id = `custom-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
      }
      customTimers.push(newConfig);
    }

    localStorage.setItem(LOCAL_STORAGE_CUSTOM_TIMERS_KEY, JSON.stringify(customTimers));
    toast({
      title: `Timer ${editId ? 'Updated' : 'Saved'}!`,
      description: `"${newConfig.name}" has been successfully ${editId ? 'updated' : 'saved'}.`,
    });
    router.push('/templates');
  };
  
  if (editId && isLoading) {
      return <div className="flex justify-center items-center min-h-[calc(100vh-200px)]"><p className="text-xl">Loading timer for editing...</p></div>;
  }

  return (
    <div className="container mx-auto px-2 py-8">
        <div className="mb-6">
            <Link href="/templates">
                <Button variant="outline">
                    <ChevronLeftIcon className="mr-2 h-4 w-4" /> Back to Templates
                </Button>
            </Link>
        </div>
      <TimerForm initialConfiguration={editingConfig} onSave={handleSaveConfiguration} />
    </div>
  );
}


export default function CreateTimerPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><p className="text-xl">Loading...</p></div>}>
      <CreateTimerPageContent />
    </Suspense>
  );
}
