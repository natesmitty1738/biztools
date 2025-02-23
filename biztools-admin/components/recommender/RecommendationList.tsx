import { useState } from 'react';
import { FiInfo, FiTrendingUp, FiTag, FiArrowRight, FiBarChart2, FiThumbsUp } from 'react-icons/fi';
import { Item } from '@prisma/client';

interface RecommendationListProps {
  items: Item[];
  onItemClick: (item: Item) => void;
}

export const RecommendationList: React.FC<RecommendationListProps> = ({ items, onItemClick }) => {
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleItemClick = async (item: Item) => {
    setSelectedItem(item.id);
    
    try {
      // Record click
      await fetch('/api/recommender/click', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemId: item.id,
          timestamp: new Date().toISOString(),
        }),
      });

      // Call onItemClick if provided
      onItemClick(item);

      setToast({
        message: `Interaction with "${item.title}" has been recorded.`,
        type: 'success'
      });
    } catch (error) {
      console.error('Error recording click:', error);
      setToast({
        message: 'Failed to record interaction.',
        type: 'error'
      });
    } finally {
      setSelectedItem(null);
      // Clear toast after 3 seconds
      setTimeout(() => setToast(null), 3000);
    }
  };

  return (
    <div className="relative">
      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg transition-all transform ${
            toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          } text-white`}
        >
          {toast.message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden cursor-pointer"
            onClick={() => handleItemClick(item)}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                <FiArrowRight className="text-blue-500" />
              </div>
              <p className="text-gray-600 mb-4 line-clamp-2">{item.description}</p>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center">
                  <FiTag className="mr-1" />
                  <span>{item.category}</span>
                </div>
                <div className="flex items-center">
                  <FiBarChart2 className="mr-1" />
                  <span>{item.clicks} clicks</span>
                </div>
                <div className="flex items-center">
                  <FiThumbsUp className="mr-1" />
                  <span>{(item.attributes as any)?.pricing || 'N/A'}</span>
                </div>
              </div>
            </div>
            <div className="px-6 py-3 bg-gray-50 border-t">
              <div className="flex flex-wrap gap-2">
                {(item.attributes as any)?.features?.slice(0, 3).map((feature: string, index: number) => (
                  <span
                    key={index}
                    className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <div className="group relative">
      <div className="flex items-center text-gray-400">
        <Icon className="mr-2" />
        <span className="text-sm truncate">{value}</span>
      </div>
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity">
        {label}
      </div>
    </div>
  );
}

function getScoreColorClass(score: number): string {
  if (score >= 0.8) return 'bg-green-500/10 text-green-400';
  if (score >= 0.6) return 'bg-blue-500/10 text-blue-400';
  if (score >= 0.4) return 'bg-yellow-500/10 text-yellow-400';
  return 'bg-red-500/10 text-red-400';
} 