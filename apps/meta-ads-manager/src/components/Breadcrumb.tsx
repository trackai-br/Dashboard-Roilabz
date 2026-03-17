import Link from 'next/link';

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  darkMode?: boolean;
}

export function Breadcrumb({ items, darkMode = false }: BreadcrumbProps) {
  const bgClass = darkMode ? 'dark:bg-gray-900 bg-gray-50' : 'bg-white dark:bg-gray-900';
  const textClass = darkMode
    ? 'dark:text-gray-300 text-gray-700'
    : 'text-gray-700 dark:text-gray-300';

  return (
    <nav className={`${bgClass} border-b border-gray-200 dark:border-gray-700 px-4 py-3`}>
      <ol className="flex items-center space-x-2">
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && <span className={`mx-2 ${textClass}`}>/</span>}
            {index === items.length - 1 ? (
              <span className={`font-medium ${textClass}`}>{item.label}</span>
            ) : (
              <Link
                href={item.href}
                className={`${textClass} hover:text-blue-600 dark:hover:text-blue-400 transition-colors`}
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
