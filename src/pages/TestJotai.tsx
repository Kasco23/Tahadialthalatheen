import {
  isArabicAtom,
  languageAtom,
  toggleLanguageAtom,
} from '@/state/languageAtoms';
import { atom, useAtom, useAtomValue } from 'jotai';
import { useState } from 'react';

// Test atom
const testAtom = atom(0);

export default function TestJotai() {
  const [error, setError] = useState<string | null>(null);

  // Use hooks at top level
  const [count, setCount] = useAtom(testAtom);
  const language = useAtomValue(languageAtom);
  const isArabic = useAtomValue(isArabicAtom);
  const [, toggleLanguage] = useAtom(toggleLanguageAtom);

  const handleToggleLanguage = () => {
    try {
      toggleLanguage();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const handleIncrement = () => {
    try {
      setCount((c) => c + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-red-900 text-white p-8">
        <h1 className="text-2xl font-bold mb-4">Jotai Error</h1>
        <pre className="bg-red-800 p-4 rounded">{error}</pre>
        <button
          onClick={() => setError(null)}
          className="mt-4 bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded"
        >
          Clear Error
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-2xl font-bold mb-4">Jotai Test Page</h1>

      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Basic Atom Test:</h2>
          <p>Count: {count}</p>
          <button
            onClick={handleIncrement}
            className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded"
          >
            Increment
          </button>
        </div>

        <div>
          <h2 className="text-lg font-semibold">Language Atoms Test:</h2>
          <p>Current Language: {language}</p>
          <p>Is Arabic: {isArabic ? 'Yes' : 'No'}</p>
          <button
            onClick={handleToggleLanguage}
            className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded"
          >
            Toggle Language
          </button>
        </div>
      </div>
    </div>
  );
}
