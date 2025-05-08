'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, EyeIcon } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-var(--header-height,10rem))] text-center animate-fadeIn px-2 sm:px-0">
      <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-secondary">
        Welcome to Zenith Timer
      </h1>
      <p className="text-lg sm:text-xl md:text-2xl text-foreground/80 mb-10 max-w-2xl">
        Elevate your focus and well-being with customizable timer sequences. Perfect for work, study, exercise, and mindfulness.
      </p>
      
      <div className="grid md:grid-cols-2 gap-6 md:gap-8 mb-12 max-w-4xl w-full">
        <Card className="bg-card/80 backdrop-blur-sm hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center text-xl md:text-2xl">
              <EyeIcon className="mr-3 text-primary h-7 w-7 md:h-8 md:w-8" />
              The 20-20-20 Rule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-left text-card-foreground/90 text-sm sm:text-base">
              Reduce digital eye strain with a simple yet effective technique. The 20-20-20 rule suggests that for every{' '}
              <strong className="text-primary">20 minutes</strong> spent looking at a screen, you should look at something{' '}
              <strong className="text-primary">20 feet</strong> away for{' '}
              <strong className="text-primary">20 seconds</strong>.
            </p>
            <ul className="mt-4 space-y-2 text-left text-sm sm:text-base">
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 mr-2 mt-0.5 sm:mt-1 text-green-400 shrink-0" />
                <span>Helps alleviate eye fatigue and dryness.</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 mr-2 mt-0.5 sm:mt-1 text-green-400 shrink-0" />
                <span>Encourages regular breaks, boosting overall productivity.</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 mr-2 mt-0.5 sm:mt-1 text-green-400 shrink-0" />
                <span>Zenith Timer comes pre-configured with this popular template!</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-card/80 backdrop-blur-sm hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="text-xl md:text-2xl">Unlock Your Potential</CardTitle>
            <CardDescription className="text-sm sm:text-base">Beyond eye care, Zenith Timer helps you structure any activity.</CardDescription>
          </CardHeader>
          <CardContent>
             <ul className="mt-4 space-y-2 text-left text-sm sm:text-base">
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 mr-2 mt-0.5 sm:mt-1 text-green-400 shrink-0" />
                <span>Create custom timers for Pomodoro, workouts, meditation, and more.</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 mr-2 mt-0.5 sm:mt-1 text-green-400 shrink-0" />
                <span>Save and reuse your favorite timer sequences.</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 mr-2 mt-0.5 sm:mt-1 text-green-400 shrink-0" />
                <span>Minimalist design to keep you focused, not distracted.</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <Link href="/templates">
        <Button 
          size="lg" 
          className="bg-primary hover:bg-primary/90 text-primary-foreground text-base py-3 px-6 sm:text-lg sm:py-4 sm:px-8 md:text-xl rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
        >
          Enter App & Explore Templates
        </Button>
      </Link>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
