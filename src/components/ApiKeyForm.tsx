import React from 'react';

interface ApiKeyFormProps {
  apiKey: string;
  setApiKey: (key: string) => void;
}

const ApiKeyForm: React.FC<ApiKeyFormProps> = ({ apiKey, setApiKey }) => {
  return (
    <div>
      <input
        type="password"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        placeholder="Enter your GROQ API Key"
        className="w-full px-4 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-blue-500"
      />
    </div>
  );
};

export default ApiKeyForm;