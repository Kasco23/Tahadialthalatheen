import type { Question, SegmentCode } from '@/types/game';

// Comprehensive questions database for each segment
export const sampleQuestions: Record<SegmentCode, Question[]> = {
  WSHA: [
    {
      id: 'wsha-1',
      text: 'من هو اللاعب الذي سجل أكبر عدد من الأهداف في تاريخ كأس العالم؟',
      answers: ['ميروسلاف كلوزه', 'كلوزه', 'Miroslav Klose'],
      difficulty: 'medium',
      points: 1,
    },
    {
      id: 'wsha-2',
      text: 'أي نادي فاز بدوري أبطال أوروبا أكثر من أي نادي آخر؟',
      answers: ['ريال مدريد', 'Real Madrid', 'ريال'],
      difficulty: 'easy',
      points: 1,
    },
    {
      id: 'wsha-3',
      text: 'في أي عام فازت البرازيل بكأس العالم لأول مرة؟',
      answers: ['1958', 'ألف وتسعمائة وثمانية وخمسون'],
      difficulty: 'hard',
      points: 1,
    },
    {
      id: 'wsha-4',
      text: 'من هو المدرب الذي فاز بكأس العالم مع ألمانيا عام 2014؟',
      answers: ['يواخيم لوف', 'لوف', 'Joachim Löw', 'Löw'],
      difficulty: 'medium',
      points: 1,
    },
    {
      id: 'wsha-5',
      text: 'كم عدد اللاعبين في فريق كرة القدم على أرض الملعب؟',
      answers: ['11', 'أحد عشر', 'احد عشر'],
      difficulty: 'easy',
      points: 1,
    },
    {
      id: 'wsha-6',
      text: 'أي لاعب يُلقب بـ "الظاهرة"؟',
      answers: ['رونالدو البرازيلي', 'رونالدو', 'Ronaldo', 'R9'],
      difficulty: 'medium',
      points: 1,
    },
    {
      id: 'wsha-7',
      text: 'في أي عام تأسس نادي برشلونة؟',
      answers: ['1899', 'ألف وثمانمائة وتسعة وتسعون'],
      difficulty: 'hard',
      points: 1,
    },
    {
      id: 'wsha-8',
      text: 'من هو أصغر لاعب سجل هدفاً في كأس العالم؟',
      answers: ['بيليه', 'Pelé', 'Pele'],
      difficulty: 'medium',
      points: 1,
    },
  ],

  AUCT: [
    {
      id: 'auct-1',
      text: 'هذا اللاعب فاز بالكرة الذهبية 7 مرات وسجل أكثر من 800 هدف في مسيرته',
      answers: ['ليونيل ميسي', 'ميسي', 'Messi', 'Lionel Messi'],
      difficulty: 'easy',
      points: 2,
    },
    {
      id: 'auct-2',
      text: 'هذا النادي الإنجليزي فاز بالدوري الإنجليزي 20 مرة ويلعب في ملعب أولد ترافورد',
      answers: [
        'مانشستر يونايتد',
        'يونايتد',
        'Manchester United',
        'Man United',
      ],
      difficulty: 'medium',
      points: 2,
    },
    {
      id: 'auct-3',
      text: 'هذا المنتخب فاز بكأس العالم 5 مرات وآخرها كان عام 2002',
      answers: ['البرازيل', 'Brazil', 'منتخب البرازيل'],
      difficulty: 'easy',
      points: 2,
    },
    {
      id: 'auct-4',
      text: 'هذا اللاعب الفرنسي فاز بكأس العالم وكان قائد المنتخب عام 1998',
      answers: ['زين الدين زيدان', 'زيدان', 'Zidane', 'Zinedine Zidane'],
      difficulty: 'medium',
      points: 2,
    },
    {
      id: 'auct-5',
      text: 'هذا النادي الإسباني يُلقب بـ "الملكي" ومقره في مدريد',
      answers: ['ريال مدريد', 'ريال', 'Real Madrid'],
      difficulty: 'easy',
      points: 2,
    },
    {
      id: 'auct-6',
      text: 'هذا اللاعب البرتغالي فاز بالكرة الذهبية 5 مرات ولعب لريال مدريد',
      answers: ['كريستيانو رونالدو', 'رونالدو', 'Cristiano Ronaldo', 'CR7'],
      difficulty: 'easy',
      points: 2,
    },
  ],

  BELL: [
    {
      id: 'bell-1',
      text: 'من هو الهداف التاريخي لنادي برشلونة؟',
      answers: ['ليونيل ميسي', 'ميسي', 'Messi'],
      difficulty: 'easy',
      points: 1,
    },
    {
      id: 'bell-2',
      text: 'كم عدد المرات التي فاز فيها ريال مدريد بدوري أبطال أوروبا؟',
      answers: ['15', 'خمسة عشر', 'خمس عشرة'],
      difficulty: 'medium',
      points: 1,
    },
    {
      id: 'bell-3',
      text: 'في أي عام فازت إسبانيا بكأس العالم لأول مرة؟',
      answers: ['2010', 'ألفين وعشرة'],
      difficulty: 'medium',
      points: 1,
    },
    {
      id: 'bell-4',
      text: 'من هو المدرب الحالي لنادي مانشستر سيتي؟',
      answers: ['بيب جوارديولا', 'جوارديولا', 'Pep Guardiola'],
      difficulty: 'easy',
      points: 1,
    },
    {
      id: 'bell-5',
      text: 'أي نادي إيطالي يُلقب بـ "العجوزة السيدة"؟',
      answers: ['يوفنتوس', 'Juventus', 'جوفي'],
      difficulty: 'medium',
      points: 1,
    },
    {
      id: 'bell-6',
      text: 'من هو اللاعب الذي سجل هدف النصر لفرنسا في نهائي كأس العالم 2018؟',
      answers: ['كيليان مبابي', 'مبابي', 'Mbappé', 'Kylian Mbappé'],
      difficulty: 'medium',
      points: 1,
    },
  ],

  SING: [
    {
      id: 'sing-1',
      text: 'أكمل شعار نادي ليفربول: "You\'ll Never Walk..."',
      answers: ['Alone', 'وحيداً', 'وحيدا'],
      difficulty: 'easy',
      points: 1,
    },
    {
      id: 'sing-2',
      text: 'ما هو لقب مشجعي نادي بوروسيا دورتموند؟',
      answers: ['الجدار الأصفر', 'Yellow Wall', 'BVB'],
      difficulty: 'hard',
      points: 1,
    },
    {
      id: 'sing-3',
      text: 'أكمل: "هالا مدريد ي نادا..."',
      answers: ['ماس', 'mas', 'Mas'],
      difficulty: 'medium',
      points: 1,
    },
    {
      id: 'sing-4',
      text: 'ما هي الكلمة المشهورة التي يرددها مشجعو برشلونة؟',
      answers: ['فيسكا برسا', 'Visca Barça', 'Força Barça'],
      difficulty: 'medium',
      points: 1,
    },
    {
      id: 'sing-5',
      text: 'أكمل شعار مانشستر يونايتد: "Glory Glory..."',
      answers: ['Man United', 'Manchester United', 'مان يونايتد'],
      difficulty: 'easy',
      points: 1,
    },
  ],

  REMO: [
    {
      id: 'remo-1',
      text: 'لاعب برازيلي، فاز بكأس العالم 3 مرات، يُعتبر أعظم لاعب في التاريخ',
      answers: ['بيليه', 'Pelé', 'Pele'],
      difficulty: 'easy',
      points: 3,
    },
    {
      id: 'remo-2',
      text: 'مدرب أرجنتيني، فاز بكأس العالم كلاعب ومدرب، توفي عام 2020',
      answers: ['دييجو مارادونا', 'مارادونا', 'Maradona', 'Diego Maradona'],
      difficulty: 'medium',
      points: 3,
    },
    {
      id: 'remo-3',
      text: 'لاعب ألماني، قائد المنتخب في كأس العالم 2014، لعب لبايرن ميونخ',
      answers: ['فيليب لام', 'لام', 'Philipp Lahm', 'Lahm'],
      difficulty: 'hard',
      points: 3,
    },
    {
      id: 'remo-4',
      text: 'لاعب إيطالي، قائد يوفنتوس السابق، فاز بكأس العالم 2006',
      answers: ['فرانشيسكو توتي', 'توتي', 'Francesco Totti', 'Totti'],
      difficulty: 'medium',
      points: 3,
    },
    {
      id: 'remo-5',
      text: 'لاعب إنجليزي، هداف مانشستر يونايتد التاريخي، فاز بكأس العالم 1966',
      answers: ['بوبي تشارلتون', 'تشارلتون', 'Bobby Charlton', 'Charlton'],
      difficulty: 'hard',
      points: 3,
    },
  ],
};

// Career clues for REMO segment (revealing information step by step)
export const careerClues: Record<string, string[]> = {
  pele: [
    'وُلد في البرازيل عام 1940',
    'بدأ مسيرته مع نادي سانتوس',
    'فاز بكأس العالم وهو في السابعة عشرة',
    'سجل أكثر من 1000 هدف في مسيرته',
    'يُلقب بـ "ملك كرة القدم"',
  ],
  maradona: [
    'وُلد في الأرجنتين عام 1960',
    'لعب لنادي بوكا جونيورز في شبابه',
    'انتقل إلى نابولي وأصبح أسطورة',
    'سجل "هدف القرن" ضد إنجلترا 1986',
    'قاد الأرجنتين لكأس العالم 1986',
  ],
  lahm: [
    'لاعب ألماني وُلد عام 1983',
    'قضى معظم مسيرته مع بايرن ميونخ',
    'لعب في مركز الظهير الأيمن والأيسر',
    'قائد المنتخب الألماني لسنوات',
    'رفع كأس العالم 2014 في البرازيل',
  ],
};

// Helper functions
export const getQuestionsForSegment = (
  segment: SegmentCode,
  count: number = 5,
): Question[] => {
  const questions = sampleQuestions[segment] || [];
  return questions.slice(0, count);
};

export const getRandomQuestions = (
  segment: SegmentCode,
  count: number = 5,
): Question[] => {
  const questions = sampleQuestions[segment] || [];
  const shuffled = [...questions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

export const getCareerClues = (playerId: string): string[] => {
  return careerClues[playerId.toLowerCase()] || [];
};

export const getAllQuestions = (): Question[] => {
  return Object.values(sampleQuestions).flat();
};

// Function to add questions to Supabase (for admin use)
export const addQuestionsToSupabase = async () => {
  // This would be used to populate the Supabase database
  // Implementation would depend on your Supabase setup
  console.log('Questions ready to be added to Supabase:', sampleQuestions);
};
