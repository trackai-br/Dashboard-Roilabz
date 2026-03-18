import Link from 'next/link';

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  darkMode?: boolean;
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="border-b px-4 py-3" style={{ backgroundColor: 'var(--bg-page)', borderBottomColor: 'var(--color-tertiary)' }}>
      <ol className="flex items-center space-x-2">
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && <span className="mx-2" style={{ color: 'var(--color-tertiary)' }}>/</span>}
            {index === items.length - 1 ? (
              <span className="font-medium" style={{ color: 'var(--color-primary)' }}>{item.label}</span>
            ) : (
              <Link
                href={item.href}
                className="transition-colors"
                style={{ color: 'var(--color-brand)' }}
              >
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
