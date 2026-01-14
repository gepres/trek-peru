'use client';

import { cn } from '@/lib/utils/cn';
import { Check } from 'lucide-react';

export interface Step {
  id: string;
  title: string;
  description?: string;
}

interface StepsProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (stepIndex: number) => void;
}

export function Steps({ steps, currentStep, onStepClick }: StepsProps) {
  return (
    <nav aria-label="Progress">
      <ol className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isClickable = onStepClick && index < currentStep;

          return (
            <li key={step.id} className="relative flex-1">
              {/* Connector line */}
              {index !== steps.length - 1 && (
                <div
                  className={cn(
                    'absolute left-1/2 top-4 h-0.5 w-full',
                    isCompleted || index < currentStep
                      ? 'bg-primary'
                      : 'bg-border'
                  )}
                  aria-hidden="true"
                />
              )}

              {/* Step button */}
              <button
                type="button"
                onClick={() => isClickable && onStepClick(index)}
                disabled={!isClickable}
                className={cn(
                  'relative flex flex-col items-center group',
                  isClickable && 'cursor-pointer'
                )}
              >
                {/* Step circle */}
                <span
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors relative z-10',
                    isCompleted &&
                      'border-primary bg-primary text-primary-foreground',
                    isCurrent &&
                      'border-primary bg-background text-primary',
                    !isCompleted &&
                      !isCurrent &&
                      'border-border bg-background text-muted-foreground',
                    isClickable && 'group-hover:border-primary'
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </span>

                {/* Step text */}
                <span className="mt-2 flex flex-col items-center">
                  <span
                    className={cn(
                      'text-xs font-medium hidden sm:block',
                      isCurrent && 'text-primary',
                      isCompleted && 'text-primary',
                      !isCompleted && !isCurrent && 'text-muted-foreground'
                    )}
                  >
                    {step.title}
                  </span>
                  {step.description && (
                    <span className="text-xs text-muted-foreground mt-0.5 hidden md:block">
                      {step.description}
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
