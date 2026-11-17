// Every piece of fixed wording in one place, so it can be edited or translated later.
// Voice B (Andrea's voice) is used for the welcome, transitions and closing. No personal stories, ever.

export const SITE = {
  name: 'Soul Blueprint',
  tagline: 'a map back to yourself',
};

export const WELCOME = {
  kicker: 'Before you begin',
  title: ['You came here', 'for a reason.'],
  paragraphs: [
    "Most of us live without knowing we each have a real soul purpose and mission. So we move through life feeling lost, or a little aimless, and we wonder why nothing quite fits.",
    "Until you meet your soul (who you are at the core, how your energy works, how you're meant to move through the world), you can't fully align with that purpose. When you do, the path gets clearer. Life starts working. You feel that your life matters.",
    "That's why I created the Soul Blueprint: to help you get to know yourself, so you can step into your soul's purpose.",
    "Nothing here is fixed. It's a snapshot of energy. Take what's true, leave what isn't.",
  ],
  howTitle: 'How to move through this',
  how: [
    ['Look for what repeats.', 'Use every tool to notice the patterns and soul themes that keep showing up. Repetition is a clue.'],
    ['Highlight what speaks to you.', 'So you can come back to the patterns that keep calling you.'],
    ["Let go of what doesn't land.", "Not everything needs to land today, and that's okay."],
    ['Come back whenever you feel lost.', 'To remember who you are and what you came here to do.'],
    ['Go slow.', "This isn't something to get through, it's something to sit with. Each chapter opens when you're ready to know yourself a little deeper."],
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
  fullNameHint: "Optional: your full birth name unlocks more of your numerology. It's turned into numbers on this device and never sent anywhere.",
  submit: 'Reveal my Blueprint',
  errors: {
    date: 'Please enter your full birth date.',
    time: 'Please enter your birth time, or tick the box if you don\'t know it.',
    city: 'Please choose your birth city from the list.',
    generic: 'Something went wrong while calculating. Please try again.',
  },
};

export const LOADING = {
  /** The quote in pieces, so the key phrases can be set in gold. */
  quoteParts: [
    ['Many of you are experiencing disease because ', false],
    ['you have forgotten your song.', true],
    [' Forgotten your vibration, your signature vibration. ', false],
    ['In aligning with your song, you can heal yourself.', true],
  ] as [string, boolean][],
  attribution: 'Bashar',
  line: "Let's find your song.",
};

/** Shown while the vehicle travels to the next stop. */
export const TRAVEL_LINES = [
  'Loading the future you…',
  'Your next chapter is on its way…',
  'Gathering the next piece of you…',
  'The road is opening…',
  'A little further, and a little deeper…',
];

export const OVERVIEW = {
  kicker: 'Your journey',
  title: ['The road', 'ahead'],
  intro: 'Nine stops, one map. Each stop shows you another side of yourself, and the last two bring it all together.',
  vehicleTitle: 'Choose how you travel',
  vehicleNote: 'Your choice travels with you along the top of every chapter.',
  cta: 'Start the journey',
  home: 'Welcome home',
};

export const VEHICLES = [
  { id: 'horse', label: 'Horse' },
  { id: 'boat', label: 'Boat' },
  { id: 'plane', label: 'Plane' },
  { id: 'ufo', label: 'UFO' },
] as const;
export type VehicleId = (typeof VEHICLES)[number]['id'];

export const LEARN_MORE_INTRO = "You don't need to read all of this. As you go, you can tap any underlined word for a quick definition. This is here if you want to learn more.";
export const HIGHLIGHT_HELP = 'Select any sentence to highlight it in one of five categories: Must knows, Positive traits, Growth opportunities, Patterns, Soul mission.';
export const NOTEPAD = {
  title: 'My notepad',
  hint: 'A free space for anything you want to remember. It saves on this device as you type.',
  placeholder: 'Write anything that comes up…',
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
  { id: 'mission', label: 'Soul mission', hex: '#D4B26A' },
] as const;
export type HighlightColor = (typeof HIGHLIGHT_COLORS)[number]['id'];

export interface ChapterMeta {
  n: number;
  /** Title split so the second part is set in italics. */
  title: [string, string];
  system: string;
  subtitle: string;
  /** One line for the journey map: what this stop gives you. */
  gives: string;
  primer: string[];
  transition: string;
  journalFallback: string[];
}

export const CHAPTERS: ChapterMeta[] = [
  {
    n: 1, title: ['Who', 'You Are'], system: 'Western astrology',
    subtitle: 'A snapshot of the sky at the moment of your first breath',
    gives: 'Your core personality and the themes of this lifetime',
    primer: [
      'Your birth chart is a map of the sky at the exact moment you were born. It shows who you are, how your energy plays out, and the patterns and themes meant for you in this lifetime.',
      'Every placement has three parts. The planet is the part of you being described. The sign is the style in which it expresses itself. The house is the area of life where it shows up most.',
      'Sun in Libra in the 5th house means your core identity (Sun) expresses itself through balance and connection (Libra), most of all in creativity and self-expression (5th house).',
    ],
    transition: "Start here. This is the map: the whole landscape of who you are.",
    journalFallback: [
      'Look at your Major Life Themes. Which one have you been living without naming it, and where does it show up in your work or relationships?',
      'Your Sun describes what you are here to be. Where in your life are you fully living it, and where are you still hiding it?',
      'Your North Node points to where you are meant to grow. What is one thing it asks of you that your old habits resist?',
    ],
  },
  {
    n: 2, title: ['How', 'You Move'], system: 'Human Design',
    subtitle: 'How your energy is built to move through the world',
    gives: 'How your energy works and how to make decisions',
    primer: [
      'Human Design shows how your energy is built to work: how you are meant to start things, how you make your best decisions, and where your energy is steady or open to others.',
      'The easiest way to understand it is to picture yourself as a vehicle. Each part of your design is one part of that vehicle.',
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
    gives: 'The energy you were born carrying',
    primer: [
      "This chapter uses the sacred 260-day calendar kept by K'iche' Maya daykeepers in Guatemala. It is the traditional count, which is different from the modern Dreamspell calendar.",
      'It gives you three things. Your nawal is the day sign you were born under, and it describes the energy you carry. Your tone, a number from 1 to 13, describes how that energy moves. Your trecena is the 13-day period you were born into, and it adds a background theme.',
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
    gives: 'The numbers behind your path and your gifts',
    primer: [
      'Numerology turns your birth date, and your name if you shared it, into a few core numbers. Each number from 1 to 9 has its own character, and each of your numbers describes a different part of your life.',
      'The numbers 11, 22 and 33 are called master numbers. They carry a stronger version of their theme and ask more of the person who has them.',
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
    gives: 'Your year animal and your inner animal',
    primer: [
      'In the Chinese zodiac, every year belongs to one of twelve animals and one of five elements. Together they describe your general character. The year changes at Lunar New Year, not on January 1.',
      'The two-hour window in which you were born adds a second animal, called your inner animal. It describes your more private self.',
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
    gives: 'The places that bring out different sides of you',
    primer: [
      'At the moment you were born, each planet was rising, setting, directly overhead or directly underfoot somewhere on Earth. Those places form lines across the world map.',
      'Living in or visiting a place near one of your lines brings that planet\'s qualities forward in you. The lines are grouped by what they are good for, and each group has its own map.',
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
    gives: 'The timing of your big life chapters',
    primer: [
      'The planets keep moving after you are born, and each one eventually returns to the position it held at your birth. These returns mark the major chapters of a life, and they happen at similar ages for everyone.',
      'They are not predictions of events. They describe what each period asks of you, so you can recognise it and work with it.',
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
    gives: 'The patterns that repeat across every tool',
    primer: [
      'Each tool you have read so far describes you in its own language. This chapter counts the themes that appear in three or more of them. A theme that repeats across separate systems is a strong signal about who you are.',
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
    gives: 'Directions for your purpose and your work',
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
  title: ['Welcome home,', 'beautiful'],
  paragraphs: [
    "That was a lot of mirrors. If parts of it were uncomfortable, good. That usually means it's true.",
    "You were never missing anything. You were carrying a map you hadn't unfolded yet. The hard parts of your story are not detours. They are the material. This is how pain gets alchemized into purpose.",
    'Come back to this whenever you forget. It reads differently each time, because you keep growing.',
  ],
  download: 'Download my Blueprint (PDF)',
  notes: 'See my notes',
};

export const FALLBACK_SYNTHESIS_INTRO = 'Here is the short version of this chapter.';
