export default function LoadingSkeleton({ type = 'card', count = 1 }) {
  const skeletons = {
    card: () => (
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 animate-pulse">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="h-4 w-24 bg-gray-200 rounded" />
            <div className="h-8 w-16 bg-gray-200 rounded mt-2" />
            <div className="h-3 w-32 bg-gray-200 rounded mt-3" />
          </div>
          <div className="w-11 h-11 bg-gray-200 rounded-xl" />
        </div>
      </div>
    ),
    table: () => (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 animate-pulse">
        <div className="p-4 border-b border-gray-100">
          <div className="h-5 w-40 bg-gray-200 rounded" />
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 border-b border-gray-50">
            <div className="h-4 w-1/4 bg-gray-200 rounded" />
            <div className="h-4 w-1/6 bg-gray-200 rounded" />
            <div className="h-4 w-1/5 bg-gray-200 rounded" />
            <div className="h-4 w-1/6 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    ),
    chart: () => (
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 animate-pulse">
        <div className="h-5 w-40 bg-gray-200 rounded mb-4" />
        <div className="h-64 bg-gray-100 rounded-lg" />
      </div>
    ),
    profile: () => (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gray-200" />
          <div>
            <div className="h-5 w-32 bg-gray-200 rounded" />
            <div className="h-4 w-24 bg-gray-200 rounded mt-2" />
          </div>
        </div>
      </div>
    ),
  };

  const Skeleton = skeletons[type] || skeletons.card;

  return (
    <>
      {[...Array(count)].map((_, i) => (
        <div key={i}><Skeleton /></div>
      ))}
    </>
  );
}
