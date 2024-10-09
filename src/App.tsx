import React, { useState, useEffect, useRef } from 'react';
import { useSpring, animated } from 'react-spring';
import WordCloud from './components/WordCloud';
import ApiKeyForm from './components/ApiKeyForm';

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>('');
  const [question, setQuestion] = useState<string>('');
  const [words, setWords] = useState<Array<{ text: string; value: number }>>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const generateWordCloud = async () => {
    if (!apiKey || !question) {
      setError('Please provide both API key and question.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "gemma2-9b-it",
          messages: [
            {
              role: "system",
              content: "You are a helpful assistant that generates a list of relevant words for word cloud visualization."
            },
            {
              role: "user",
              content: `Generate a list of 30 relevant words for a word cloud based on this question: "${question}". Provide the words as a comma-separated list without explanations or additional text.`
            }
          ],
          temperature: 0.7,
          max_tokens: 256,
          top_p: 1,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      const wordList = content.split(',').map(word => word.trim());

      const wordFrequency: { [key: string]: number } = {};
      wordList.forEach(word => {
        wordFrequency[word] = (wordFrequency[word] || 0) + 1;
      });

      const newWords = Object.entries(wordFrequency).map(([text, value]) => ({ text, value }));
      setWords(newWords);
    } catch (error) {
      console.error('Error generating word cloud:', error);
      setError(`Failed to generate word cloud: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const props = useSpring({
    from: { background: 'linear-gradient(120deg, #000000, #2c3e50)' },
    to: async (next) => {
      while (true) {
        await next({ background: 'linear-gradient(120deg, #2c3e50, #000000)' });
        await next({ background: 'linear-gradient(120deg, #000000, #2c3e50)' });
      }
    },
    config: { duration: 5000 },
  });

  return (
    <animated.div style={props} className="min-h-screen flex flex-col items-center justify-center p-4 text-white">
      <div className="w-full max-w-md mb-8">
        <h1 className="text-3xl font-bold mb-4 text-center">Dynamic Word Cloud Generator</h1>
        <ApiKeyForm apiKey={apiKey} setApiKey={setApiKey} />
        <div className="mt-4">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Enter your question"
            className="w-full px-4 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-blue-500"
          />
        </div>
        <button
          onClick={generateWordCloud}
          disabled={loading}
          className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-300 ease-in-out transform hover:scale-105"
        >
          {loading ? 'Generating...' : 'Generate Word Cloud'}
        </button>
      </div>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      <div ref={containerRef} className="w-full h-[calc(100vh-300px)] word-cloud-container">
        <WordCloud words={words} width={containerRef.current?.clientWidth || 800} height={containerRef.current?.clientHeight || 600} />
      </div>
    </animated.div>
  );
};

export default App;