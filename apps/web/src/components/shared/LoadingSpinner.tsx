import { Skeleton } from "@/components/ui/skeleton"

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LoadingSpinner({ size = "md", className = "" }: LoadingSpinnerProps) {
  if (size === "sm") {
    // Small inline spinner
    return (
      <svg className={`animate-spin h-4 w-4 ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    )
  }

  // Content skeleton for md/lg loading states
  return (
    <div className={`w-full space-y-4 p-4 animate-fade-in ${className}`}>
      <Skeleton className="h-8 w-1/3" />
      <div className="space-y-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  )
}

export function PageLoader() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center bg-transparent">
      <LoadingSpinner size="lg" />
    </div>
  )
}

export function LoadingCard({ className = "" }: { className?: string }) {
  return (
    <div className={`p-5 bg-white border border-gray-100 rounded-xl shadow-sm space-y-4 ${className}`}>
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </div>
    </div>
  )
}

export function LoadingTableFull({ className = "" }: { className?: string }) {
  return (
    <div className={`bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden p-6 space-y-6 ${className}`}>
       <div className="flex justify-between items-center border-b border-gray-100 pb-4">
         <Skeleton className="h-6 w-1/4" />
         <Skeleton className="h-8 w-24 rounded-lg" />
       </div>
       <div className="space-y-4">
         {[1, 2, 3, 4, 5].map((i) => (
           <div key={i} className="flex gap-4">
             <Skeleton className="h-4 w-1/5" />
             <Skeleton className="h-4 w-1/4" />
             <Skeleton className="h-4 w-1/4" />
             <Skeleton className="h-4 w-1/5" />
           </div>
         ))}
       </div>
    </div>
  )
}
