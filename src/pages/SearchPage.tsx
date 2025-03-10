// src/pages/SearchPage.tsx
const SearchPage = () => {
    return (
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold text-vault-blue mb-6">Search Media</h1>
        
        <div className="flex flex-col md:flex-row gap-6">
          {/* Filters */}
          <div className="w-full md:w-1/4 bg-white p-4 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Search Filters</h2>
            {/* Search filters will go here */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Keywords</label>
                <input 
                  type="text" 
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                  placeholder="Search by keyword..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Date Range</label>
                <div className="flex gap-2">
                  <input 
                    type="date" 
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                  />
                  <input 
                    type="date" 
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                  />
                </div>
              </div>
              
              <button className="w-full bg-vault-blue text-white font-bold px-4 py-2 rounded hover:bg-blue-800">
                Search
              </button>
            </div>
          </div>
          
          {/* Results */}
          <div className="w-full md:w-3/4 bg-white p-4 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Results</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Sample placeholders */}
              {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
                <div key={item} className="aspect-square bg-gray-200 rounded-md"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  export default SearchPage;