import type { TimerConfiguration } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { LayersIcon, RepeatIcon, ClockIcon, PlayCircleIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TemplateCardProps {
  template: TimerConfiguration;
  onSelect: (templateId: string) => void;
  className?: string;
}

const TemplateCard = ({ template, onSelect, className }: TemplateCardProps) => {
  const totalDurationSeconds = template.segments.reduce((total, segment) => {
    const workTime = segment.work.length * segment.time;
    return total + workTime + segment.rest;
  }, 0) + (template.segments.length > 1 ? (template.segments.length -1 ) * template.restBetweenSections : 0) ;
  
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes === 0) return `${remainingSeconds}s`;
    if (remainingSeconds === 0) return `${minutes}m`;
    return `${minutes}m ${remainingSeconds}s`;
  };


  return (
    <Card 
      className={cn("bg-card/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 ease-in-out flex flex-col justify-between h-full", className)}
      role="button"
      tabIndex={0}
      onClick={() => onSelect(template.id)}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect(template.id)}
    >
      <CardHeader>
        <CardTitle className="text-xl lg:text-2xl font-semibold text-primary">{template.name}</CardTitle>
        <CardDescription className="text-sm lg:text-base text-card-foreground/80 h-20 overflow-hidden text-ellipsis">
          {template.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="space-y-2 text-sm text-card-foreground/90">
          <div className="flex items-center">
            <LayersIcon className="h-4 w-4 mr-2 text-accent" />
            <span>{template.segments.length} segment{template.segments.length > 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center">
            <ClockIcon className="h-4 w-4 mr-2 text-accent" />
            <span>Approx. {formatDuration(totalDurationSeconds)}</span>
          </div>
          <div className="flex items-center">
            <RepeatIcon className="h-4 w-4 mr-2 text-accent" />
            <span>{template.repeat ? "Repeats" : "Runs once"}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          variant="default" 
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          onClick={(e) => {
            e.stopPropagation(); // Prevent card click event
            onSelect(template.id);
          }}
          aria-label={`Select ${template.name} template`}
        >
          <PlayCircleIcon className="mr-2 h-5 w-5" />
          Use Template
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TemplateCard;
