import React from 'react'

interface EmptyStateProps {
  icon: string
  title: string
  description: string
  action?: React.ReactNode
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center animate-fade-in max-w-md mx-auto">
      <div className="w-20 h-20 rounded-full bg-light-surface dark:bg-dark-surface flex items-center justify-center mb-6 shadow-inner border border-light-border/20 dark:border-dark-border/20 group hover:scale-105 transition-transform duration-500">
        <span className="material-symbols-outlined text-4xl text-light-muted dark:text-dark-muted group-hover:text-primary transition-colors">
          {icon}
        </span>
      </div>
      <h3 className="text-xl font-black text-light-text dark:text-dark-text mb-2 tracking-tight">
        {title}
      </h3>
      <p className="text-sm text-light-text-2 dark:text-dark-text-2 leading-relaxed mb-8 opacity-80">
        {description}
      </p>
      {action && (
        <div className="w-full flex justify-center scale-110">
          {action}
        </div>
      )}
    </div>
  )
}

interface SkeletonProps {
  className?: string
  variant?: 'rectangular' | 'circular' | 'text'
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', variant = 'rectangular' }) => {
  const baseClasses = "animate-pulse bg-light-surface dark:bg-dark-surface/50 border border-light-border/5 dark:border-dark-border/5"
  const variantClasses = {
    rectangular: "rounded-card",
    circular: "rounded-full",
    text: "rounded h-4 w-full"
  }

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`} />
  )
}
