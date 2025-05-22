"use client";

import { useState } from 'react';

export default function DebugPage() {
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [response, setResponse] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);

  const testApi = async () => {
    try {
      setStatus('Testing API...');
      setError('');
      
      // Test the API with a simple request
      const resp = await fetch('/api/submit-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requiredFiles: ['test']
        })
      });
      
      const data = await resp.json();
      setResponse(JSON.stringify(data, null, 2));
      setStatus(`API test complete. Status: ${resp.status}`);
    } catch (error: any) {
      setError(`Error: ${error.message}`);
      setStatus('Test failed');
    }
  };

  const uploadFile = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }
    
    try {
      setStatus('Uploading file...');
      setError('');
      
      // Upload to our mock endpoint
      const resp = await fetch('/api/upload-mock', {
        method: 'PUT',
        body: file
      });
      
      if (resp.ok) {
        setStatus(`File upload complete. Status: ${resp.status}`);
      } else {
        setError(`Upload failed with status: ${resp.status}`);
      }
    } catch (error: any) {
      setError(`Error: ${error.message}`);
      setStatus('Upload failed');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">API Debug Page</h1>
      
      <div className="mb-8 p-4 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Test API Endpoint</h2>
        <button 
          onClick={testApi}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Test /api/submit-form
        </button>
      </div>
      
      <div className="mb-8 p-4 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Test File Upload</h2>
        <div className="mb-4">
          <input 
            type="file" 
            onChange={handleFileChange}
            className="mb-4"
          />
        </div>
        <button 
          onClick={uploadFile}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
          disabled={!file}
        >
          Upload File
        </button>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        <div className="p-4 border rounded-lg">
          <h3 className="font-medium mb-2">Status</h3>
          <div className="bg-gray-100 p-2 rounded">
            {status || 'No test run yet'}
          </div>
        </div>
        
        {error && (
          <div className="p-4 border border-red-300 bg-red-50 rounded-lg">
            <h3 className="font-medium mb-2 text-red-700">Error</h3>
            <div className="bg-white p-2 rounded">
              {error}
            </div>
          </div>
        )}
        
        {response && (
          <div className="p-4 border rounded-lg">
            <h3 className="font-medium mb-2">Response</h3>
            <pre className="bg-gray-100 p-2 rounded overflow-auto max-h-60">
              {response}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
} 