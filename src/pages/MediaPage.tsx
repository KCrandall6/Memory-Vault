// src/pages/MediaPage.tsx
import { useParams } from 'react-router-dom';

const MediaPage = () => {
  const { id } = useParams();
  
  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold text-vault-blue mb-6">Media Details</h1>
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* Media display */}
        <div className="w-full md:w-3/4 bg-white p-4 rounded-lg shadow-md">
          <div className="aspect-video bg-gray-200 rounded flex items-center justify-center">
            <p className="text-gray-500">Media ID: {id}</p>
          </div>
        </div>
        
        {/* Info panel */}
        <div className="w-full md:w-1/4 bg-white p-4 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Information</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-700">Title</h3>
              <p>Sample Media Title</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700">Date</h3>
              <p>January 1, 2023</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700">Collection</h3>
              <p>Family Vacation</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700">People</h3>
              <p>John, Jane, Alex</p>
            </div>
            
            <button className="w-full bg-vault-yellow text-vault-blue font-bold px-4 py-2 rounded hover:bg-yellow-500">
              Download
            </button>
          </div>
        </div>
      </div>
      
      {/* Comments section */}
      <div className="mt-6 bg-white p-4 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Comments</h2>
        <div className="space-y-4">
          <div className="p-3 bg-gray-50 rounded">
            <div className="font-medium">John Doe</div>
            <div className="text-gray-600">What a great memory!</div>
          </div>
          
          <div className="border-t pt-4">
            <h3 className="font-medium mb-2">Add a Comment</h3>
            <div className="space-y-2">
              <input 
                type="text" 
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                placeholder="Your name"
              />
              <textarea
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                placeholder="Your comment"
                rows={3}
              ></textarea>
              <button className="bg-vault-blue text-white font-bold px-4 py-2 rounded hover:bg-blue-800">
                Add Comment
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaPage;