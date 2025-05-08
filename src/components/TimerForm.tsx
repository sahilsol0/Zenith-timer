'use client';

import { useState, useEffect } from 'react';
import type { TimerConfiguration, TimerSegment } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import SegmentEditor from './SegmentEditor';
import { PlusCircleIcon, SaveIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { useToast } from '@/hooks/use-toast';

interface TimerFormProps {
  initialConfiguration?: TimerConfiguration;
  onSave: (configuration: TimerConfiguration) => void;
}

const generateId = () => `custom-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;

const emptySegment: TimerSegment = {
  name: 'New Segment',
  work: ['Task 1'],
  time: 60, // 1 minute default
  rest: 10,  // 10 seconds default
  restString: 'Resting',
};

const emptyConfiguration: TimerConfiguration = {
  id: generateId(),
  name: 'My Custom Timer',
  description: 'A new custom timer sequence.',
  segments: [JSON.parse(JSON.stringify(emptySegment))], // Deep copy
  restBetweenSections: 0,
  repeat: false,
  isCustom: true,
};

const TimerForm = ({ initialConfiguration, onSave }: TimerFormProps) => {
  const { toast } = useToast();
  const [config, setConfig] = useState<TimerConfiguration>(
    initialConfiguration ? JSON.parse(JSON.stringify(initialConfiguration)) : JSON.parse(JSON.stringify(emptyConfiguration))
  );

  useEffect(() => {
    if (initialConfiguration) {
      setConfig(JSON.parse(JSON.stringify(initialConfiguration)));
    } else {
      // Ensure new ID for brand new forms
      const newConf = JSON.parse(JSON.stringify(emptyConfiguration));
      newConf.id = generateId();
      setConfig(newConf);
    }
  }, [initialConfiguration]);


  const handleInputChange = (field: keyof TimerConfiguration, value: string | number | boolean) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const addSegment = () => {
    setConfig(prev => ({
      ...prev,
      segments: [...prev.segments, JSON.parse(JSON.stringify(emptySegment))],
    }));
  };

  const updateSegment = (index: number, updatedSegment: TimerSegment) => {
    const newSegments = [...config.segments];
    newSegments[index] = updatedSegment;
    setConfig(prev => ({ ...prev, segments: newSegments }));
  };

  const removeSegment = (index: number) => {
    if (config.segments.length <= 1) {
        toast({
            title: "Cannot Remove",
            description: "A timer must have at least one segment.",
            variant: "destructive",
        });
        return;
    }
    const newSegments = config.segments.filter((_, i) => i !== index);
    setConfig(prev => ({ ...prev, segments: newSegments }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (config.name.trim() === "") {
        toast({ title: "Validation Error", description: "Timer name cannot be empty.", variant: "destructive" });
        return;
    }
    if (config.segments.some(s => s.name.trim() === "")) {
        toast({ title: "Validation Error", description: "Segment names cannot be empty.", variant: "destructive" });
        return;
    }
     if (config.segments.some(s => s.work.some(w => w.trim() === ""))) {
        toast({ title: "Validation Error", description: "Work item instructions cannot be empty.", variant: "destructive" });
        return;
    }
    if (config.segments.some(s => s.time <= 0)) {
        toast({ title: "Validation Error", description: "Segment instruction duration must be greater than 0.", variant: "destructive" });
        return;
    }
    onSave({ ...config, isCustom: true }); // Ensure isCustom is true
  };

  return (
    <Card className="w-full max-w-2xl mx-auto bg-card/80 backdrop-blur-sm">
      <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
        <CardTitle className="text-2xl sm:text-3xl text-primary">{initialConfiguration ? 'Edit Timer' : 'Create New Timer'}</CardTitle>
        <CardDescription className="text-sm sm:text-base">
          {initialConfiguration ? 'Modify the details of your custom timer.' : 'Design your own timer sequence for any activity.'}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6 px-4 sm:px-6">
          <div>
            <Label htmlFor="timer-name" className="text-base sm:text-lg">Timer Name</Label>
            <Input
              id="timer-name"
              value={config.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g., Morning Workout, Study Block"
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="timer-description" className="text-base sm:text-lg">Description</Label>
            <Textarea
              id="timer-description"
              value={config.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Briefly describe this timer sequence"
              rows={3}
              className="mt-1"
            />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg sm:text-xl font-semibold text-foreground/90">Segments</h3>
            {config.segments.map((segment, index) => (
              <SegmentEditor
                key={index} // Consider more stable keys if segments can be reordered
                segment={segment}
                index={index}
                onUpdate={updateSegment}
                onRemove={removeSegment}
              />
            ))}
            <Button type="button" variant="outline" onClick={addSegment} className="w-full text-primary border-primary hover:bg-primary/10">
              <PlusCircleIcon className="h-5 w-5 mr-2" /> Add Segment
            </Button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div>
              <Label htmlFor="rest-between-sections" className="text-base sm:text-lg">Rest Between Repeats (seconds)</Label>
              <Input
                id="rest-between-sections"
                type="number"
                min="0"
                value={config.restBetweenSections}
                onChange={(e) => handleInputChange('restBetweenSections', parseInt(e.target.value, 10) || 0)}
                disabled={!config.repeat}
                className="mt-1"
              />
            </div>
            <div className="flex items-center space-x-2 pt-4 sm:pt-6">
              <Checkbox
                id="repeat-timer"
                checked={config.repeat}
                onCheckedChange={(checked) => handleInputChange('repeat', Boolean(checked))}
              />
              <Label htmlFor="repeat-timer" className="text-base sm:text-lg">Repeat Sequence</Label>
            </div>
          </div>

        </CardContent>
        <CardFooter className="px-4 sm:px-6 pb-4 sm:pb-6">
          <Button type="submit" size="lg" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
            <SaveIcon className="h-5 w-5 mr-2" /> Save Timer Configuration
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default TimerForm;
