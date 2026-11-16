// Every piece of fixed wording in one place, so it can be edited or translated later.
// Voice B (Andrea's voice) is used for the welcome, transitions and closing. No personal stories, ever.

export const SITE = {
  name: 'Soul Blueprint',
  tagline: 'a map back to yourself',
};

export const WELCOME = {
  kicker: 'Before you begin',
  title: ["You didn't lose yourself.", 'You hid the map.'],
  paragraphs: [
    "Before you were born, your soul made a quiet agreement: to forget. Not because forgetting was a mistake. It's the only way to meet yourself again, from a new angle, in a life you've never lived before.",
    "What follows are the breadcrumbs your soul left behind. Your birth chart, your Human Design, your Mayan sign, your numbers and more. They aren't answers. They're mirrors. They reflect back what's already there, so you can finally recognize it.",
    "Nothing here is fixed. This is a snapshot of energy, not a cage. Take what's true. Leave what isn't.",
  ],
  howTitle: 'How to move through this',
  how: [
    ['Highlight what speaks to you.', 'Notice the quiet "oh" of recognition. Select any sentence and choose a color to keep it.'],
    ["Let go of what doesn't.", "Not everything needs to land today, and that's okay."],
    ['Go slow.', "This isn't something to get through. It's something to sit with. Each chapter opens when you're ready for it."],
  ] as [string, string][],
  cta: 'Begin',
};

export const FORM = {
  title: ['Tell me when', 'you arrived'],
  intro: 'Your birth details are used once to calculate your Blueprint. They are not stored on any server.',
  firstName: 'First name',
  firstNameHint: 'Only used to greet you.',
  date: 'Birth date',
  time: 'Birth time',
  timeHint: 'The more exact your birth time, the more precise your reading. Check your birth certificate if you can.',
  unknownTime: "I don't know my birth time",
  city: 'Birth city',
  cityPlaceholder: 'Start typing your city',
  cityHint: "Choose your city from the list. Can't find a very small town? Choose the nearest larger one.",
  fullName: 'Full birth name (optional)',
  fullNameHint: "Optional: share your full name exactly as it appears on your birth certificate and we'll reveal even more of your numerology. You can skip this.",
  fullNamePrivacy: 'Your name is turned into numbers on this device. The name itself is never sent anywhere.',
  submit: 'Reveal my Blueprint',
  errors: {
    date: 'Please enter your full birth date.',
    time: 'Please enter your birth time, or tick the box if you don\'t know it.',
    city: 'Please choose your birth city from the list.',
    generic: 'Something went wrong while calculating. Please try again.',
  },
};

export const LOADING = {
  quote:
    'Many of you are experiencing disease because you have forgotten your song. Forgotten your vibration, your signature vibration. In aligning with your song, you can heal yourself.',
  attribution: 'Bashar',
  line: "Let's find your song.",
};

export const NOTICE =
  'Your highlights and reflections save automatically on this device. Clearing your browser history, using a private window, or switching phones will erase them. You can download your Blueprint with all your saved notes as a PDF anytime.';

export const UNKNOWN_TIME_LINE = "Because your birth time is unknown, some parts of this chapter aren't shown. What's here is still true for you.";
export const DEPENDS_ON_TIME = 'This depends on your exact birth time.';
export const ADD_NAME_NOTE = 'Add your full birth name to reveal your Expression, Soul Urge and Personality numbers.';
export const ROCKEFELLIA_OPENER = 'A modern placement some astrologers use to explore how you build wealth.';
export const ACG_ZONE_LINE = 'Each line is a zone a few hundred miles wide, not an exact point. If a city is near a line, you are in its influence.';

export const HIGHLIGHT_COLORS = [
  { id: 'must', label: 'Must knows', hex: '#B7D1EA' },
  { id: 'positive', label: 'Positive traits', hex: '#F3EEE6' },
  { id: 'growth', label: 'Growth opportunities', hex: '#D9A7B0' },
  { id: 'pattern', label: 'Patterns', hex: '#B0B4B8' },
] as const;
export type HighlightColor = (typeof HIGHLIGHT_COLORS)[number]['id'];

export interface ChapterMeta {
  n: number;
  /** Title split so the second part is set in italics. */
  title: [string, string];
  system: string;
  subtitle: string;
  primer: string[];
  transition: string;
  journalFallback: string[];
}

export const CHAPTERS: ChapterMeta[] = [
  {
    n: 1, title: ['Who', 'You Are'], system: 'Western astrology',
    subtitle: 'A snapshot of the sky at the moment of your first breath',
    primer: [
      'Planet = what energy or part of you it is. Sign = how that energy expresses itself. House = where in life it shows up most.',
      'So "Sun in Libra in the 5th house" reads as: my core identity (Sun), expressed through balance and connection (Libra), showing up most in creativity and self-expression (5th house).',
      'Tap any underlined word for a quick definition.',
    ],
    transition: "Start here. This is the map: the whole landscape of who you are.",
    journalFallback: [
      'Which placement made you feel most seen? What did it name that you already knew?',
      'Where in your life are you living your Sun, and where are you still hiding it?',
      'Which growth edge here feels most alive for you right now?',
    ],
  },
  {
    n: 2, title: ['How', 'You Move'], system: 'Human Design',
    subtitle: 'How your energy is built to move through the world',
    primer: [
      'Think of yourself as a vehicle. Type = what kind of vehicle you are. Strategy = how to start the engine. Authority = your GPS for decisions.',
      'Centers = which parts of the engine run on their own fuel (defined) and which borrow fuel from the people around you (open). Open is not a weakness. It is where you learn. Profile = your driving style.',
    ],
    transition: "The map alone doesn't move you. This is the vehicle: how you're built to travel.",
    journalFallback: [
      'When have you followed your Strategy without knowing it had a name? What happened?',
      'Think of a decision you made from your head that your body disagreed with. What did your body know?',
      'Whose energy have you been carrying that was never yours to hold?',
    ],
  },
  {
    n: 3, title: ['Your', 'Soul Signature'], system: 'Traditional Mayan astrology',
    subtitle: 'The sacred energy you were born carrying, and the way it naturally moves through your life',
    primer: [
      "This comes from the sacred 260-day calendar still kept by Maya daykeepers in Guatemala. Your nawal (day sign) is the energy you were born carrying. Your tone, a number from 1 to 13, is how that energy moves.",
      'Your trecena is the 13-day period you were born into. It is the wider current underneath your day.',
    ],
    transition: "Every journey needs a reason. This is the energy you came in carrying.",
    journalFallback: [
      'Where do you already see your nawal at work in your life?',
      'What does the growth edge of your day sign ask of you this season?',
      'How does your tone describe the way you actually move through things?',
    ],
  },
  {
    n: 4, title: ['Your', "Soul's Numbers"], system: 'Numerology',
    subtitle: 'The numbers folded into your birth date and your name',
    primer: [
      'Numerology turns your birth date, and your name if you shared it, into a few core numbers. Each number from 1 to 9 has its own character.',
      '11, 22 and 33 are master numbers. They are kept as they are, and they ask a little more of you.',
    ],
    transition: 'Now the numbers. A simpler language, and it says the same things in a different accent.',
    journalFallback: [
      'How have you been walking your Life Path without naming it?',
      'What is your Personal Year asking you to begin, tend or release?',
      'Which number feels like a gift, and which feels like homework?',
    ],
  },
  {
    n: 5, title: ['Your', 'Inner Animal'], system: 'Chinese zodiac',
    subtitle: 'The year you arrived in, and the animal that walks with you',
    primer: [
      'In the Chinese zodiac, each year belongs to one of twelve animals and one of five elements. The year turns at Lunar New Year, not on January 1.',
      'The two-hour window you were born in adds a second animal, sometimes called your inner or secret animal.',
    ],
    transition: 'A lighter chapter. Meet the animal that walks with you.',
    journalFallback: [
      'Which quality of your year animal do people notice in you first?',
      'Which quality do you keep hidden, and what would it take to let it out?',
      'How does your element color the way you go after what you want?',
    ],
  },
  {
    n: 6, title: ['Where', 'You Thrive'], system: 'Astrocartography',
    subtitle: 'The places on Earth that light up different parts of you',
    primer: [
      'At the moment you were born, each planet was rising, setting, overhead or underfoot somewhere on Earth. Those places form lines on the map.',
      'Living in or visiting a place near a line can bring that planet\'s energy forward in you. Each line is a zone a few hundred miles wide, not an exact point.',
    ],
    transition: 'Same you, different soil. Some places bring different parts of you forward.',
    journalFallback: [
      'Which places have you felt most yourself in? Do any sit near your lines?',
      'Is there a place you have always been pulled toward without knowing why?',
      'What part of you is asking for a change of scenery, even a small one?',
    ],
  },
  {
    n: 7, title: ['Your', 'Life Cycles'], system: 'Saturn, Chiron, Nodal and Jupiter returns',
    subtitle: 'The chapters your soul planned, and when they open',
    primer: [
      'Planets keep moving after you are born, and each one eventually returns to where it was at your birth. Those returns mark the big chapters of a life.',
      'These are not predictions. They are seasons. Knowing the season helps you work with it.',
    ],
    transition: "You're not behind. You're on a schedule your soul wrote. Here it is.",
    journalFallback: [
      'Look at a cycle you have already lived through. What was life asking of you then?',
      'What changed in you during that time that you can only see now?',
      'Which upcoming chapter are you most curious about, and what would you like to have in place when it opens?',
    ],
  },
  {
    n: 8, title: ['Your', 'Soul Themes'], system: 'The echoes across every system',
    subtitle: 'The patterns that repeat, no matter which language you read yourself in',
    primer: [
      'Every system you have read so far speaks a different language. When the same theme shows up in three or more of them, it is worth listening to.',
      'Each theme below lists exactly where it came from in your Blueprint.',
    ],
    transition: 'This is the part where it all starts saying the same thing.',
    journalFallback: [
      'Which theme did you already know, deep down?',
      'Which theme have you been resisting, and what has that resistance been protecting?',
      'Where in your life is each theme already alive?',
    ],
  },
  {
    n: 9, title: ['Your', "Soul's Work"], system: 'Themes turned into directions',
    subtitle: 'Possibilities to explore, never prescriptions',
    primer: [
      'Your soul gifts and your lived experiences are the raw material of your work in the world. This chapter turns your themes into directions you could explore.',
      'These are possibilities, not instructions. Notice which one makes your body lean in.',
    ],
    transition: 'So what do you do with all this? Let\'s look at where it could go.',
    journalFallback: [],
  },
];

export const CLOSING = {
  kicker: 'Before you go',
  title: ['Come home', 'to yourself'],
  paragraphs: [
    "That was a lot of mirrors. If parts of it were uncomfortable, good. That usually means it's true.",
    "You were never missing anything. You were carrying a map you hadn't unfolded yet. The hard parts of your story are not detours. They are the material. This is how pain gets alchemized into purpose.",
    'Come back to this whenever you forget. It reads differently each time, because you keep growing.',
  ],
  download: 'Download my Blueprint (PDF)',
  notes: 'See my notes',
};

export const FALLBACK_SYNTHESIS_INTRO = 'Here is the short version of this chapter.';
