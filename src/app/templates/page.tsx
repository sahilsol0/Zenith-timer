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
    const storedCustomTimers = localStorage.getItem(LOCAL_STORAGE_CUSTOM_TIMERS_KEY);
    let parsedCustomTimers: TimerConfiguration[] = [];
    if (storedCustomTimers) {
      try {
        parsedCustomTimers = JSON.parse(storedCustomTimers);
      } catch (error) {
        console.error("Failed to parse custom timers from localStorage:", error);
        localStorage.removeItem(LOCAL_STORAGE_CUSTOM_TIMERS_KEY); // Clear corrupted data
      }
    }
    setCustomTimers(parsedCustomTimers);
    setAllTimers([...TIMER_TEMPLATES, ...parsedCustomTimers]);
  }, []);

  const handleSelectTemplate = (templateId: string) => {
    router.push(`/timer?templateId=${templateId}`);
  };

  const handleDeleteCustomTimer = (timerId: string) => {
    const updatedCustomTimers = customTimers.filter(timer => timer.id !== timerId);
    localStorage.setItem(LOCAL_STORAGE_CUSTOM_TIMERS_KEY, JSON.stringify(updatedCustomTimers));
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
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-primary">Choose a Timer Template</h1>
        <Link href="/create">
          <Button variant="default" className="bg-primary hover:bg-primary/90">
            <PlusCircleIcon className="mr-2 h-5 w-5" />
            Create New Timer
          </Button>
        </Link>
      </div>

      {TIMER_TEMPLATES.length > 0 && (
        <>
          <h2 className="text-2xl font-semibold text-foreground/90 mb-4">Pre-configured Timers</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {TIMER_TEMPLATES.map((template) => (
              <TemplateCard key={template.id} template={template} onSelect={handleSelectTemplate} />
            ))}
          </div>
        </>
      )}

      {customTimers.length > 0 && (
        <>
          <h2 className="text-2xl font-semibold text-foreground/90 mb-4">Your Custom Timers</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {customTimers.map((template) => (
              <div key={template.id} className="relative group">
                <TemplateCard template={template} onSelect={handleSelectTemplate} />
                <AlertDialog open={showDeleteConfirm === template.id} onOpenChange={(isOpen) => !isOpen && setShowDeleteConfirm(null)}>
                  <AlertDialogTrigger asChild>
                     <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
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
          <p className="text-xl text-foreground/70 mb-4">No timers found. Ready to create your first one?</p>
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
