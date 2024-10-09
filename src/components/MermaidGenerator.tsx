import React, { useState, useEffect, useRef } from 'react';
import mermaid from 'mermaid';

interface MermaidGeneratorProps {
  apiKey: string;
}

const MermaidGenerator: React.FC<MermaidGeneratorProps> = ({ apiKey }) => {
  const [input, setInput] = useState('');
  const [mermaidCode, setMermaidCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamedResponse, setStreamedResponse] = useState('');
  const [error, setError] = useState<string | null>(null);
  const mermaidRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mermaid.initialize({ startOnLoad: true, theme: 'dark' });
  }, []);

  useEffect(() => {
    if (mermaidCode) {
      try {
        mermaid.render('mermaid-diagram', mermaidCode).then((result) => {
          if (mermaidRef.current) {
            mermaidRef.current.innerHTML = result.svg;
          }
        });
      } catch (error) {
        console.error('Error rendering Mermaid diagram:', error);
        setError('Failed to render Mermaid diagram. Please check the Mermaid code syntax.');
      }
    }
  }, [mermaidCode]);

  const generateMermaidDiagram = async () => {
    setLoading(true);
    setStreamedResponse('');
    setMermaidCode('');
    setError(null);

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "llama3-8b-8192",
          messages: [
            {
              role: "system",
              content: "You are a helpful assistant that generates Mermaid diagram code. Generate the Mermaid code directly without any markdown formatting. Use simple node names without spaces or special characters."
            },
            {
              role: "user",
              content: `Please analyze and generate a Mermaid diagram code for this content, using the graph LR format. Use simple node names without spaces or special characters: ${input}`
            }
          ],
          temperature: 0.7,
          max_tokens: 1024,
          top_p: 1,
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorBody}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader!.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;
            
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0].delta.content || '';
              setStreamedResponse(prev => prev + content);
            } catch (error) {
              console.error('Error parsing JSON:', error);
              setError(`Error parsing JSON: ${(error as Error).message}`);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error generating Mermaid diagram:', error);
      setError(`Failed to generate Mermaid diagram: ${(error as Error).message}`);
    } finally {
      setLoading(false);
      extractMermaidCode(streamedResponse);
    }
  };

  const extractMermaidCode = (response: string) => {
    // First, try to extract code from backticks
    const backtickMatch = response.match(/```(?:mermaid)?\s*(graph LR[\s\S]*?)```/);
    if (backtickMatch) {
      setMermaidCode(cleanMermaidCode(backtickMatch[1]));
      return;
    }

    // If no backticks, look for 'graph LR' directly
    const graphMatch = response.match(/graph LR[\s\S]*?(?=\n\n|\n$|$)/);
    if (graphMatch) {
      setMermaidCode(cleanMermaidCode(graphMatch[0]));
      return;
    }

    // If still no match, try to find any content that looks like Mermaid code
    const mermaidLikeMatch = response.match(/(?:graph|flowchart|sequenceDiagram|classDiagram|stateDiagram)[\s\S]*?(?=\n\n|\n$|$)/);
    if (mermaidLikeMatch) {
      setMermaidCode(cleanMermaidCode(mermaidLikeMatch[0]));
      return;
    }

    // If no valid Mermaid code found
    setMermaidCode(response);
    setError('No valid Mermaid code found in the response. The API might not have generated a valid diagram.');
  };

  const cleanMermaidCode = (code: string) => {
    let cleanedCode = code.trim();
    
    // Remove quotes from node labels
    cleanedCode = cleanedCode.replace(/\[label "([^"]+)"\]/g, '[$1]');
    
    // Replace spaces in node names with underscores
    cleanedCode = cleanedCode.replace(/(\w+)\s*(\[|\()/g, (match, p1, p2) => `${p1.replace(/\s+/g, '_')}${p2}`);
    
    // Remove extra spaces around arrows
    cleanedCode = cleanedCode.replace(/\s*-->\s*/g, ' --> ');
    cleanedCode = cleanedCode.replace(/\s*->>\s*/g, ' ->> ');
    
    return cleanedCode;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter your content to generate a Mermaid mind map"
          className="flex-grow px-4 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-blue-500"
          rows={4}
        />
        <button
          onClick={generateMermaidDiagram}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
        >
          {loading ? 'Generating...' : 'Generate Diagram'}
        </button>
      </div>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <h2 className="text-xl font-bold mb-2">Mermaid Diagram</h2>
          <div ref={mermaidRef} className="bg-gray-800 p-4 rounded"></div>
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold mb-2">Mermaid Code</h2>
          <textarea
            value={mermaidCode}
            onChange={(e) => setMermaidCode(e.target.value)}
            className="w-full h-64 px-4 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>
      <div>
        <h2 className="text-xl font-bold mb-2">Streamed Response</h2>
        <pre className="bg-gray-800 p-4 rounded text-white whitespace-pre-wrap">
          {streamedResponse}
        </pre>
      </div>
    </div>
  );
};

export default MermaidGenerator;