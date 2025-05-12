'use client';

import TemplateCard from '@/components/TemplateCard';
import { TIMER_TEMPLATES, LOCAL_STORAGE_CUSTOM_TIMERS_KEY } from '@/lib/constants';
import type { TimerConfiguration } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircleIcon, Trash2Icon } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';

export default function TemplatesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [customTimers, setCustomTimers] = useState<TimerConfiguration[]>([]);
  const [allTimers, setAllTimers] = useState<TimerConfiguration[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);


  useEffect(() => {
    let storedCustomTimers: string | null = null;
    try {
      storedCustomTimers = localStorage.getItem(LOCAL_STORAGE_CUSTOM_TIMERS_KEY);
    } catch (error) {
      console.error("Failed to access custom timers from localStorage:", error);
      toast({ title: "Error Loading Timers", description: "Could not retrieve your custom timers.", variant: "destructive" });
    }
    
    let parsedCustomTimers: TimerConfiguration[] = [];
    if (storedCustomTimers) {
      try {
        parsedCustomTimers = JSON.parse(storedCustomTimers);
      } catch (error) {
        console.error("Failed to parse custom timers from localStorage:", error);
        toast({ title: "Data Error", description: "Your custom timer data might be corrupted. Clearing it.", variant: "destructive" });
        try {
          localStorage.removeItem(LOCAL_STORAGE_CUSTOM_TIMERS_KEY); // Clear corrupted data
        } catch (removeError) {
          console.error("Failed to remove corrupted custom timers from localStorage:", removeError);
        }
      }
    }
    setCustomTimers(parsedCustomTimers);
    setAllTimers([...TIMER_TEMPLATES, ...parsedCustomTimers]);
  }, [toast]);

  const handleSelectTemplate = (templateId: string) => {
    router.push(`/timer?templateId=${templateId}`);
  };

  const handleDeleteCustomTimer = (timerId: string) => {
    const updatedCustomTimers = customTimers.filter(timer => timer.id !== timerId);
    try {
      localStorage.setItem(LOCAL_STORAGE_CUSTOM_TIMERS_KEY, JSON.stringify(updatedCustomTimers));
    } catch (error) {
      console.error("Failed to save updated custom timers to localStorage:", error);
      toast({
          title: "Error Deleting Timer",
          description: "Could not update timer data in your browser's storage.",
          variant: "destructive",
      });
      setShowDeleteConfirm(null);
      return;
    }
    setCustomTimers(updatedCustomTimers);
    setAllTimers([...TIMER_TEMPLATES, ...updatedCustomTimers]);
    toast({
        title: "Timer Deleted",
        description: "Your custom timer has been successfully deleted.",
    });
    setShowDeleteConfirm(null);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 space-y-4 md:space-y-0">
        <h1 className="text-3xl sm:text-4xl font-bold text-primary">Choose a Timer Template</h1>
        <Link href="/create">
          <Button variant="default" className="bg-primary hover:bg-primary/90 w-full md:w-auto">
            <PlusCircleIcon className="mr-2 h-5 w-5" />
            Create New Timer
          </Button>
        </Link>
      </div>

      {TIMER_TEMPLATES.length > 0 && (
        <>
          <h2 className="text-xl sm:text-2xl font-semibold text-foreground/90 mb-4">Pre-configured Timers</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {TIMER_TEMPLATES.map((template) => (
              <TemplateCard key={template.id} template={template} onSelect={handleSelectTemplate} />
            ))}
          </div>
        </>
      )}

      {customTimers.length > 0 && (
        <>
          <h2 className="text-xl sm:text-2xl font-semibold text-foreground/90 mb-4">Your Custom Timers</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {customTimers.map((template) => (
              <div key={template.id} className="relative group">
                <TemplateCard template={template} onSelect={handleSelectTemplate} />
                <AlertDialog open={showDeleteConfirm === template.id} onOpenChange={(isOpen) => !isOpen && setShowDeleteConfirm(null)}>
                  <AlertDialogTrigger asChild>
                     <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10 p-2 h-8 w-8" // Smaller button
                        onClick={(e) => {
                           e.stopPropagation();
                           setShowDeleteConfirm(template.id);
                        }}
                        aria-label={`Delete ${template.name}`}
                      >
                        <Trash2Icon className="h-4 w-4" />
                      </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the timer template "{template.name}".
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => setShowDeleteConfirm(null)}>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDeleteCustomTimer(template.id)}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
          </div>
        </>
      )}
      
      {allTimers.length === 0 && (
         <div className="text-center py-10 bg-card/70 backdrop-blur-sm rounded-lg">
          <p className="text-lg sm:text-xl text-foreground/70 mb-4">No timers found. Ready to create your first one?</p>
          <Link href="/create">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <PlusCircleIcon className="mr-2 h-5 w-5" />
              Create Your First Timer
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
