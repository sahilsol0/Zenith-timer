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
      <CardHeader className="p-3 xs:p-4 sm:p-6">
        <CardTitle className="text-base xs:text-lg sm:text-xl lg:text-2xl font-semibold text-primary">{template.name}</CardTitle>
        <CardDescription className="text-[0.7rem] xs:text-xs sm:text-sm lg:text-base text-card-foreground/80 h-16 xs:h-20 overflow-hidden text-ellipsis leading-snug xs:leading-normal">
          {template.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow px-3 xs:p-4 sm:px-6 pt-0">
        <div className="space-y-1.5 xs:space-y-2 text-[0.7rem] xs:text-xs sm:text-sm text-card-foreground/90">
          <div className="flex items-center">
            <LayersIcon className="h-3 w-3 xs:h-4 xs:w-4 mr-1.5 xs:mr-2 text-accent" />
            <span>{template.segments.length} segment{template.segments.length > 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center">
            <ClockIcon className="h-3 w-3 xs:h-4 xs:w-4 mr-1.5 xs:mr-2 text-accent" />
            <span>Approx. {formatDuration(totalDurationSeconds)}</span>
          </div>
          <div className="flex items-center">
            <RepeatIcon className="h-3 w-3 xs:h-4 xs:w-4 mr-1.5 xs:mr-2 text-accent" />
            <span>{template.repeat ? "Repeats" : "Runs once"}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-3 xs:p-4 sm:p-6">
        <Button 
          variant="default" 
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-xs sm:text-sm py-2 sm:py-2.5"
          onClick={(e) => {
            e.stopPropagation(); 
            onSelect(template.id);
          }}
          aria-label={`Select ${template.name} template`}
        >
          <PlayCircleIcon className="mr-1.5 xs:mr-2 h-4 w-4 sm:h-5 sm:w-5" />
          Use Template
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TemplateCard;