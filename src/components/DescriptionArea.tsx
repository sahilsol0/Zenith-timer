import { cn } from "@/lib/utils";

interface DescriptionAreaProps {
  text: string;
  className?: string;
}

const DescriptionArea = ({ text, className }: DescriptionAreaProps) => {
  return (
    <div className={cn(
      "text-center text-lg sm:text-xl md:text-2xl text-foreground/80 min-h-[3em] p-3 sm:p-4 rounded-lg bg-card/70 backdrop-blur-sm shadow-md transition-all duration-300",
      className
    )}>
      <p>{text || "Waiting for timer..."}</p>
    </div>
  );
};

export default DescriptionArea;
