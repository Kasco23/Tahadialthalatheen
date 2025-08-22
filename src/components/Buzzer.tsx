import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameState } from '@/hooks/useGameAtoms';

export default function Buzzer() {
  const state = useGameState();
  const [isPressed, setIsPressed] = useState(false);

  const handleBuzzerClick = () => {
    if (state.currentSegment === 'BELL' && !isPressed) {
      setIsPressed(true);
      // For now, just visual feedback. Bell logic can be added later.
      setTimeout(() => setIsPressed(false), 1000);
    }
  };

  const canBuzz = state.currentSegment === 'BELL' && !isPressed;

  return (
    <div className="flex items-center justify-center p-8">
      <motion.button
        onClick={handleBuzzerClick}
        disabled={!canBuzz}
        className={`w-32 h-32 rounded-full border-4 font-bold text-xl font-arabic transition-all duration-200 ${
          canBuzz
            ? 'bg-red-500 border-red-600 text-white hover:bg-red-600 active:scale-95'
            : 'bg-gray-400 border-gray-500 text-gray-600 cursor-not-allowed'
        }`}
        whileTap={canBuzz ? { scale: 0.9 } : {}}
        animate={isPressed ? { scale: 1.1 } : { scale: 1 }}
      >
        {isPressed ? 'تم!' : 'جرس'}
      </motion.button>

      {state.currentSegment === 'BELL' && (
        <p className="ml-4 text-white/70 font-arabic">اضغط الجرس للإجابة!</p>
      )}
    </div>
  );
}
