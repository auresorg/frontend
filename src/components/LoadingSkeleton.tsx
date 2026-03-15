// components/templates/LoadingSkeleton.tsx
export function LoadingSkeleton() {
    return (
        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
                <li key={i}>
                    <div className="relative aspect-video rounded-2xl overflow-hidden animate-pulse bg-gray-200 dark:bg-gray-800" />
                </li>
            ))}
        </ul>
    );
}