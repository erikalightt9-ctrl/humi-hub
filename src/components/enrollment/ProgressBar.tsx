interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
}

export function ProgressBar({ currentStep, totalSteps, stepLabels }: ProgressBarProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-2">
        {stepLabels.map((label, index) => {
          const step = index + 1;
          const isCompleted = step < currentStep;
          const isCurrent = step === currentStep;

          return (
            <div key={label} className="flex-1 flex flex-col items-center relative">
              {/* Connector line */}
              {index < totalSteps - 1 && (
                <div
                  className={`absolute top-4 left-1/2 w-full h-0.5 z-0 ${
                    isCompleted ? "bg-blue-600" : "bg-gray-200"
                  }`}
                />
              )}

              {/* Circle */}
              <div
                className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 ${
                  isCompleted
                    ? "bg-blue-600 border-blue-600 text-white"
                    : isCurrent
                    ? "bg-white border-blue-600 text-blue-600"
                    : "bg-white border-gray-300 text-gray-400"
                }`}
              >
                {isCompleted ? "✓" : step}
              </div>

              {/* Label */}
              <span
                className={`mt-1 text-xs font-medium hidden sm:block ${
                  isCurrent ? "text-blue-700" : isCompleted ? "text-blue-500" : "text-gray-400"
                }`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Mobile current step label */}
      <p className="sm:hidden text-center text-sm font-medium text-blue-700 mt-2">
        Step {currentStep} of {totalSteps}: {stepLabels[currentStep - 1]}
      </p>
    </div>
  );
}
