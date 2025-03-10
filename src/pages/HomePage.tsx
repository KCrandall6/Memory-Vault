// src/pages/HomePage.tsx
const HomePage = () => {
    return (
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold text-vault-blue mb-6">Welcome to Memory Vault</h1>
        
        {/* Featured media section will go here */}
        <div className="p-6 bg-white rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">Featured Memories</h2>
          <div className="h-64 bg-gray-200 rounded flex items-center justify-center">
            Carousel will be implemented here
          </div>
        </div>
        
        {/* Quick actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Upload New Media</h2>
            <p className="mb-4">Add new photos, documents or videos to your vault.</p>
            <button className="bg-vault-yellow text-vault-blue font-bold px-4 py-2 rounded hover:bg-yellow-500">
              Start Upload
            </button>
          </div>
          
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Search Your Archive</h2>
            <p className="mb-4">Find your cherished memories quickly and easily.</p>
            <button className="bg-vault-blue text-white font-bold px-4 py-2 rounded hover:bg-blue-800">
              Search
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  export default HomePage;