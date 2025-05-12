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
      let customTimersRaw: string | null = null;
      try {
        customTimersRaw = localStorage.getItem(LOCAL_STORAGE_CUSTOM_TIMERS_KEY);
      } catch (e) {
        console.error("Failed to access custom timers from localStorage:", e);
        toast({ title: "Error", description: "Could not load timer data.", variant: "destructive" });
        setIsLoading(false);
        router.replace('/create');
        return;
      }

      let foundConfig: TimerConfiguration | undefined = undefined;
      if (customTimersRaw) {
        try {
          const customTimers: TimerConfiguration[] = JSON.parse(customTimersRaw);
          foundConfig = customTimers.find(t => t.id === editId);
        } catch (e) {
          console.error("Failed to parse custom timers:", e);
          toast({ title: "Error", description: "Could not load timer for editing due to corrupted data.", variant: "destructive" });
        }
      }
      
      if (foundConfig) {
        setEditingConfig(foundConfig);
      } else {
        toast({ title: "Not Found", description: "Timer to edit was not found or data is inaccessible.", variant: "destructive" });
        router.replace('/create'); 
      }
    }
    setIsLoading(false);
  }, [editId, router, toast]);


  const handleSaveConfiguration = (newConfig: TimerConfiguration) => {
    let customTimersRaw: string | null = null;
    try {
      customTimersRaw = localStorage.getItem(LOCAL_STORAGE_CUSTOM_TIMERS_KEY);
    } catch (error) {
      console.error("Failed to access custom timers from localStorage for saving:", error);
      toast({ title: "Error Saving", description: "Could not access existing timer data. Your new timer may not be saved correctly with others.", variant: "destructive" });
      // Allow saving anyway, but it might overwrite or be the only list
    }
    
    let customTimers: TimerConfiguration[] = [];
    if (customTimersRaw) {
      try {
        customTimers = JSON.parse(customTimersRaw);
      } catch (error) {
        console.error("Failed to parse custom timers, starting fresh list:", error);
        customTimers = []; 
      }
    }

    if (editId) { 
      const index = customTimers.findIndex(t => t.id === editId);
      if (index > -1) {
        customTimers[index] = newConfig;
      } else { 
        customTimers.push(newConfig);
      }
    } else { 
      if (customTimers.some(t => t.id === newConfig.id) || TIMER_TEMPLATES.some(t => t.id === newConfig.id)) {
         newConfig.id = `custom-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
      }
      customTimers.push(newConfig);
    }

    try {
      localStorage.setItem(LOCAL_STORAGE_CUSTOM_TIMERS_KEY, JSON.stringify(customTimers));
    } catch (error) {
      console.error("Failed to save custom timers to localStorage:", error);
      toast({ title: "Error Saving", description: "Could not save timer data to your browser's storage.", variant: "destructive" });
      return;
    }

    toast({
      title: `Timer ${editId ? 'Updated' : 'Saved'}!`,
      description: `"${newConfig.name}" has been successfully ${editId ? 'updated' : 'saved'}.`,
    });
    router.push('/templates');
  };
  
  if (editId && isLoading) {
      return <div className="flex justify-center items-center min-h-[calc(100vh-200px)]"><p className="text-lg sm:text-xl">Loading timer for editing...</p></div>;
  }

  return (
    <div className="container mx-auto px-2 py-8">
        <div className="mb-6">
            <Link href="/templates">
                <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                    <ChevronLeftIcon className="mr-1.5 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" /> Back to Templates
                </Button>
            </Link>
        </div>
      <TimerForm initialConfiguration={editingConfig} onSave={handleSaveConfiguration} />
    </div>
  );
}


export default function CreateTimerPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><p className="text-lg sm:text-xl">Loading...</p></div>}>
      <CreateTimerPageContent />
    </Suspense>
  );
}
