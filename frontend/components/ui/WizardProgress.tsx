'use client';
interface WizardProgressProps {
  currentStep: number;
  totalSteps: number;
  stepLabels?: string[];
  steps?: string[];
}

export default function WizardProgress({ currentStep, totalSteps, stepLabels, steps }: WizardProgressProps) {
  const labels = stepLabels ?? steps;
  const pct = Math.round(((currentStep) / totalSteps) * 100);

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-600">Step {currentStep} of {totalSteps}</span>
        <span className="text-sm font-medium text-brand-600">{pct}% complete</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-brand-600 h-2 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      {labels && (
        <p className="text-xs text-gray-500 mt-2">{labels[currentStep - 1]}</p>
      )}
    </div>
  );
}
