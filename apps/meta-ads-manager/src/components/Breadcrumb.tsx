import Link from 'next/link';

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav
      className="border-b px-4 py-3"
      style={{
        backgroundColor: 'var(--bg-page)',
        borderBottomColor: 'var(--border-light)',
      }}
    >
      <ol className="flex items-center space-x-2">
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <span className="mx-2" style={{ color: 'var(--color-tertiary)' }}>
                /
              </span>
            )}
            {index === items.length - 1 ? (
              <span
                className="font-medium"
                style={{
                  color: 'var(--neon-green)',
                  textShadow: '0 0 6px rgba(57, 255, 20, 0.2)',
                  fontFamily: "'Space Grotesk', system-ui, sans-serif",
                }}
              >
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="transition-colors hover:opacity-80"
                style={{
                  color: 'var(--neon-green)',
                  textShadow: '0 0 6px rgba(57, 255, 20, 0.15)',
                  fontFamily: "'Space Grotesk', system-ui, sans-serif",
                }}
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
