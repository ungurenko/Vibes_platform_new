import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, description, action, children }) => (
  <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
    <div>
      <h2 className="font-display text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white mb-2">
        {title}
      </h2>
      {description && <p className="text-zinc-500 dark:text-zinc-400">{description}</p>}
    </div>
    <div className="flex items-center gap-3">
        {children}
        {action}
    </div>
  </div>
);
