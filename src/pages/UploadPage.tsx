// src/pages/UploadPage.tsx
const UploadPage = () => {
    return (
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold text-vault-blue mb-6">Upload Media</h1>
        
        <div className="flex flex-col md:flex-row gap-6">
          {/* Queue */}
          <div className="w-full md:w-1/4 bg-white p-4 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Upload Queue</h2>
            <div className="border-2 border-dashed border-gray-300 p-8 text-center rounded-lg">
              <p>No files selected yet</p>
              <button className="mt-4 bg-vault-yellow text-vault-blue font-bold px-4 py-2 rounded hover:bg-yellow-500">
                Select Files
              </button>
            </div>
          </div>
          
          {/* Preview */}
          <div className="w-full md:w-2/4 bg-white p-4 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Preview</h2>
            <div className="h-80 bg-gray-200 rounded flex items-center justify-center">
              <p className="text-gray-500">No file selected</p>
            </div>
          </div>
          
          {/* Form */}
          <div className="w-full md:w-1/4 bg-white p-4 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Media Information</h2>
            <p className="text-gray-500">Select a file to add information</p>
          </div>
        </div>
      </div>
    );
  };
  
  export default UploadPage;