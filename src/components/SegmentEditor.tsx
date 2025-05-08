import type { TimerSegment } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Trash2Icon, PlusCircleIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface SegmentEditorProps {
  segment: TimerSegment;
  index: number;
  onUpdate: (index: number, updatedSegment: TimerSegment) => void;
  onRemove: (index: number) => void;
}

const SegmentEditor = ({ segment, index, onUpdate, onRemove }: SegmentEditorProps) => {
  const handleInputChange = (field: keyof TimerSegment, value: string | number) => {
    onUpdate(index, { ...segment, [field]: value });
  };

  const handleWorkItemChange = (workItemIndex: number, value: string) => {
    const newWorkItems = [...segment.work];
    newWorkItems[workItemIndex] = value;
    onUpdate(index, { ...segment, work: newWorkItems });
  };

  const addWorkItem = () => {
    onUpdate(index, { ...segment, work: [...segment.work, 'New Task'] });
  };

  const removeWorkItem = (workItemIndex: number) => {
    if (segment.work.length <= 1) return; // Keep at least one work item
    const newWorkItems = segment.work.filter((_, idx) => idx !== workItemIndex);
    onUpdate(index, { ...segment, work: newWorkItems });
  };

  return (
    <Card className="mb-6 bg-card/90 border-border shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
        <CardTitle className="text-lg sm:text-xl text-primary">Segment {index + 1}: {segment.name || "Untitled Segment"}</CardTitle>
        <Button variant="ghost" size="icon" onClick={() => onRemove(index)} aria-label="Remove segment" className="h-8 w-8 sm:h-9 sm:w-9">
          <Trash2Icon className="h-4 w-4 sm:h-5 sm:w-5 text-destructive" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4 px-4 sm:px-6 pb-4 sm:pb-6">
        <div>
          <Label htmlFor={`segment-name-${index}`} className="text-sm sm:text-base">Segment Name</Label>
          <Input
            id={`segment-name-${index}`}
            value={segment.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="e.g., Warm-up, Focus Work"
            className="mt-1"
          />
        </div>

        <div>
          <Label className="text-sm sm:text-base">Work Items / Instructions</Label>
          {segment.work.map((item, workItemIndex) => (
            <div key={workItemIndex} className="flex items-start sm:items-center space-x-2 mb-2">
              <Textarea
                value={item}
                onChange={(e) => handleWorkItemChange(workItemIndex, e.target.value)}
                placeholder={`Instruction ${workItemIndex + 1}`}
                rows={2} // Adjusted rows for better mobile visibility
                className="flex-grow mt-1 sm:mt-0"
              />
              {segment.work.length > 1 && (
                <Button variant="ghost" size="icon" onClick={() => removeWorkItem(workItemIndex)} aria-label="Remove work item" className="h-8 w-8 sm:h-9 sm:w-9 mt-1 sm:mt-0 shrink-0">
                  <Trash2Icon className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addWorkItem} className="mt-1 text-primary border-primary hover:bg-primary/10 text-xs sm:text-sm">
            <PlusCircleIcon className="h-4 w-4 mr-1 sm:mr-2" /> Add Instruction
          </Button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
                <Label htmlFor={`segment-time-${index}`} className="text-sm sm:text-base">Duration per Instruction (seconds)</Label>
                <Input
                    id={`segment-time-${index}`}
                    type="number"
                    min="1"
                    value={segment.time}
                    onChange={(e) => handleInputChange('time', parseInt(e.target.value, 10) || 0)}
                    className="mt-1"
                />
            </div>
            <div>
                <Label htmlFor={`segment-rest-${index}`} className="text-sm sm:text-base">Rest After Segment (seconds)</Label>
                <Input
                    id={`segment-rest-${index}`}
                    type="number"
                    min="0"
                    value={segment.rest}
                    onChange={(e) => handleInputChange('rest', parseInt(e.target.value, 10) || 0)}
                    className="mt-1"
                />
            </div>
        </div>

        <div>
          <Label htmlFor={`segment-restString-${index}`} className="text-sm sm:text-base">Rest Instruction</Label>
          <Input
            id={`segment-restString-${index}`}
            value={segment.restString}
            onChange={(e) => handleInputChange('restString', e.target.value)}
            placeholder="e.g., Short break, prepare for next"
            className="mt-1"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default SegmentEditor;
