import type { ReactNode } from 'react'

interface PageHeaderProps {
  eyebrow?: string
  title: ReactNode
  sub?: string
  actions?: ReactNode
}

export function PageHeader({ eyebrow, title, sub, actions }: PageHeaderProps) {
  return (
    <div className="page-header mb-6">
      <div>
        {eyebrow && <div className="eyebrow mb-2">{eyebrow}</div>}
        <h1 className="h-1">{title}</h1>
        {sub && <p className="lead mt-2" style={{ marginTop: 8 }}>{sub}</p>}
      </div>
      {actions && <div className="row gap-2">{actions}</div>}
    </div>
  )
}
