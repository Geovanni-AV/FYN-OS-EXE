import React, { ReactNode } from 'react'

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────
export interface EmptyStateProps {
  icon: string
  title: string
  description: string
  action?: ReactNode
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center animate-fade-in max-w-md mx-auto relative overflow-hidden">
      <div className="absolute inset-0 bg-primary/5 dark:bg-primary/5 blur-3xl rounded-full -z-10 animate-pulse" />
      <div className="w-20 h-20 rounded-full bg-light-surface dark:bg-dark-surface flex items-center justify-center mb-6 shadow-xl border border-light-border/20 dark:border-dark-border/20 group hover:scale-105 transition-transform duration-500">
        <span className="material-symbols-outlined text-4xl text-light-muted dark:text-dark-muted group-hover:text-primary transition-colors">
          {icon}
        </span>
      </div>
      <h3 className="text-xl font-black text-light-text dark:text-dark-text mb-2 tracking-tight uppercase">
        {title}
      </h3>
      <p className="text-sm text-light-text-2 dark:text-dark-text-2 leading-relaxed mb-8 opacity-80 italic">
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

// ─── SKELETON ─────────────────────────────────────────────────────────────────
export interface SkeletonProps {
  className?: string
  variant?: 'rectangular' | 'circular' | 'text'
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', variant = 'rectangular' }) => {
  const baseClasses = "animate-pulse bg-light-border/20 dark:bg-dark-border/20 relative overflow-hidden"
  const variantClasses = {
    rectangular: "rounded-card",
    circular: "rounded-full",
    text: "rounded h-4 w-full"
  }

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
    </div>
  )
}
