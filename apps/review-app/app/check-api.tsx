"use client";

import { useEffect, useState } from "react";

export function CheckApiConnection() {
  const [apiStatus, setApiStatus] = useState<'loading' | 'connected' | 'error'>('loading');
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [debugResponse, setDebugResponse] = useState<any>(null);
  const [apiUrl, setApiUrl] = useState<string>('');

  useEffect(() => {
    setApiUrl(process.env.NEXT_PUBLIC_API_URL || 'No configurado');
    
    const checkApi = async () => {
      try {
        // Probar el endpoint principal
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/review/list`);
        if (!response.ok) throw new Error("Failed to fetch from API");
        const data = await response.json();
        setApiResponse(data);
        
        // Probar el endpoint de depuración
        try {
          // Usamos la base de la URL del API principal
          const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api$/, '');
          const debugResp = await fetch(`${baseUrl}/api/debug/all-inspections`);
          if (debugResp.ok) {
            const debugData = await debugResp.json();
            setDebugResponse(debugData);
          }
        } catch (error) {
          console.warn("Error fetching debug data:", error);
        }
        
        setApiStatus('connected');
      } catch (error) {
        console.error("Error connecting to API:", error);
        setApiStatus('error');
        
        // Intentar el endpoint de debug como fallback
        try {
          const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api$/, '');
          const debugResp = await fetch(`${baseUrl}/api/debug/all-inspections`);
          if (debugResp.ok) {
            const debugData = await debugResp.json();
            setDebugResponse(debugData);
            setApiStatus('connected');
          }
        } catch (debugError) {
          console.error("Error connecting to debug API:", debugError);
        }
      }
    };

    checkApi();
  }, []);

  return (
    <div className="p-4 border rounded-lg mb-4">
      <h2 className="text-lg font-bold mb-2">API Connection Status</h2>
      <p className="mb-2">
        API URL: <span className="font-mono">{apiUrl}</span>
      </p>
      <p className="mb-2">
        Status: {' '}
        {apiStatus === 'loading' && <span className="text-yellow-500">Checking connection...</span>}
        {apiStatus === 'connected' && <span className="text-green-500">Connected</span>}
        {apiStatus === 'error' && <span className="text-red-500">Error connecting to API</span>}
      </p>
      
      {apiStatus === 'connected' && apiResponse && (
        <div className="mb-4">
          <h3 className="font-bold">API Response:</h3>
          <p className="mb-2">Found {apiResponse.length} inspections via /review/list</p>
          <div className="bg-gray-100 p-2 rounded mb-4">
            <pre className="text-xs overflow-auto max-h-48">
              {JSON.stringify(apiResponse, null, 2)}
            </pre>
          </div>
        </div>
      )}
      
      {debugResponse && (
        <div>
          <h3 className="font-bold">Debug Response:</h3>
          <p className="mb-2">Found {debugResponse.length} inspections via debug endpoint</p>
          <div className="bg-gray-100 p-2 rounded">
            <pre className="text-xs overflow-auto max-h-48">
              {JSON.stringify(debugResponse, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
} 