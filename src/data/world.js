// All slice-1 rooms and items as plain data. Logic lives in the engine.

export const rooms = {
  cockpit: {
    id: 'cockpit',
    name: 'Crashed Cockpit',
    description: (s) => {
      const base =
        (s.flags.visorFixed
          ? 'Your visor is patched and holding. '
          : 'A red OXYGEN LOW warning blinks — your helmet visor is cracked. ') +
        'A MISSION SCREEN flickers on the dashboard. ' +
        'An EXIT HATCH leads outside. Along the wall is a STORAGE LOCKER';
      if (!s.flags.lockerOpen) return base + ' (shut).';
      const r = rooms.cockpit;
      const inside = [];
      if ((r.items || []).includes('sealant')) inside.push('SUPER GLUE');
      if ((r.items || []).includes('wrench')) inside.push('WRENCH');
      if ((r.items || []).includes('firstAidKit')) inside.push('FIRST AID KIT');
      return base + (inside.length ? ` (open — ${inside.join(', ')} inside).` : ' (open — empty).');
    },
    items: ['missionScreen', 'locker'],
    exits: {
      out: { to: 'surface', locked: (s) => !s.flags.visorFixed,
        lockedMsg: 'WARNING: Your oxygen is leaking rapidly! You need to find something in the ship to seal your visor before you go out!' },
    },
  },

  surface: {
    id: 'surface',
    name: 'Martian Surface',
    description: (s) =>
      'Red dust stretches in every direction. Your wrecked ship leans behind you, and far off a ' +
      'SANDSTORM is rolling closer. Half-buried in the sand is a brownish-red TRAPDOOR. ' +
      (s.flags.trapdoorOpen ? 'The trapdoor stands open, a ladder leading DOWN.' : ''),
    items: ['trapdoor'],
    exits: {
      in: 'cockpit',
      back: 'cockpit',
      down: { to: 'shaft', locked: (s) => !s.flags.trapdoorOpen,
        lockedMsg: 'The trapdoor is shut tight. Maybe you can PRY it open.' },
    },
  },

  shaft: {
    id: 'shaft',
    name: 'Airlock Shaft',
    description:
      'You climb down into a metal shaft. The storm howls above as the trapdoor thumps shut. ' +
      'The air down here is warm and breathable — this base has working life support. ' +
      'A doorway leads DOWN into the base.',
    items: [],
    exits: { up: 'surface', down: 'entryHall' },
  },

  entryHall: {
    id: 'entryHall',
    name: 'Base Entry Hall',
    description: (s) =>
      'An abandoned Martian base. Flickering MONITORS line the walls, covered in strange symbols. ' +
      'A hallway leads to the CONTROL ROOM. ' +
      (s.flags.loggedIn
        ? 'A security door to the CORRIDOR now stands unlocked.'
        : 'A heavy security door to the CORRIDOR is sealed.'),
    items: ['monitors'],
    exits: {
      up: 'shaft',
      control: 'terminalRoom',
      corridor: { to: 'corridor', locked: (s) => !s.flags.loggedIn,
        lockedMsg: 'The security door is sealed. The main TERMINAL must be unlocked first.' },
    },
  },

  terminalRoom: {
    id: 'terminalRoom',
    name: 'Control Room',
    description:
      'A glowing TERMINAL waits for a login. Beside it, four Martian symbols are scrambled on the screen. ' +
      'An ETCHING is scratched into the wall.',
    items: ['terminal', 'etching'],
    exits: { back: 'entryHall' },
  },

  corridor: {
    id: 'corridor',
    name: 'Guard Corridor',
    description: (s) =>
      'A long corridor. A maintenance ALCOVE — just big enough to slip behind — opens to one side. ' +
      (s.flags.hasAccessCode
        ? 'The corridor is quiet now. A doorway leads NORTH to a vault.'
        : 'A PATROL ALIEN is marching this way!'),
    items: ['alcove', 'patrolAlien'],
    exits: {
      back: 'entryHall',
      vault: { to: 'vault', locked: (s) => !s.flags.hasAccessCode,
        lockedMsg: 'The patrol alien is blocking the way to the VAULT. You need to get past it first.' },
    },
  },

  vault: {
    id: 'vault',
    name: 'Vault Antechamber',
    description: (s) =>
      'A small room with a second VAULT TERMINAL and a thick STEEL DOOR. ' +
      (s.flags.vaultOpen
        ? 'The steel door has slid open. Inside, a radiant CRYSTAL glows, and a SHARP TOOL lies in the corner.'
        : 'The steel door is locked. The terminal asks for an access code — try ENTER and your code.'),
    items: ['vaultTerminal', 'steelDoor'],
    exits: { back: 'corridor' },
  },
};

export const items = {
  missionScreen: {
    id: 'missionScreen', name: 'mission screen', aliases: ['screen', 'mission', 'dashboard'], takeable: false,
    description: 'A cracked dashboard screen, still flickering with an urgent message.',
    readText:
      '*** MISSION LOG — URGENT ***\n' +
      'Long-range scans detected HOSTILE Martian lifeforms on the surface. ' +
      'ABORT MISSION. Do NOT make contact. Repair the shuttle and return to Earth immediately.',
  },
  locker: {
    id: 'locker', name: 'storage locker', aliases: ['locker', 'cabinet', 'storage'], takeable: false,
    description: (s) => s.flags.lockerOpen
      ? 'An open storage locker. Inside you see SUPER GLUE, a WRENCH, and a FIRST AID KIT.'
      : 'A wall-mounted storage locker, shut but not locked.',
  },
  sealant: {
    id: 'sealant', name: 'super glue', aliases: ['glue', 'tube', 'sealant', 'super'], takeable: true,
    description: 'A fat tube of fast-drying super glue. Should work on just about anything.',
  },
  wrench: {
    id: 'wrench', name: 'wrench', aliases: ['pry bar', 'prybar', 'bar', 'pipe'], takeable: true,
    description: 'A heavy wrench. Good for prying — or swinging.',
  },
  firstAidKit: {
    id: 'firstAidKit', name: 'first aid kit', aliases: ['first aid', 'kit', 'medkit'], takeable: true,
    description: 'A standard emergency first aid kit. Hopefully you won\'t need it.',
  },
  trapdoor: {
    id: 'trapdoor', name: 'trapdoor', aliases: ['door', 'hatch'], takeable: false,
    description: 'A brownish-red trapdoor, half-buried in red sand.',
  },
  monitors: {
    id: 'monitors', name: 'monitors', aliases: ['monitor', 'screens'], takeable: false,
    description: (s) => (s.flags.loggedIn
      ? 'The monitors now read in English: maps and warnings about base patrols.'
      : 'Wall monitors covered in scrambled Martian symbols.'),
  },
  terminal: {
    id: 'terminal', name: 'terminal', aliases: ['computer', 'login'], takeable: false,
    description: 'The main login terminal. It wants the four symbols in the right order.',
  },
  etching: {
    id: 'etching', name: 'etching', aliases: ['wall', 'scratch', 'clue'], takeable: false,
    description: 'Scratched words on the wall.',
    readText: 'The etching reads: "The lock wakes in this order — SUN, STAR, BEAM, ROCK."',
  },
  alcove: {
    id: 'alcove', name: 'alcove', aliases: ['crates', 'nook', 'cover'], takeable: false,
    description: 'A shadowy maintenance alcove. Big enough to hide behind.',
  },
  patrolAlien: {
    id: 'patrolAlien', name: 'patrol alien', aliases: ['alien', 'patrol', 'guard'], takeable: false,
    description: 'A Martian patrol guard, clomping down the corridor.',
  },
  codeTablet: {
    id: 'codeTablet', name: 'code tablet', aliases: ['tablet', 'codebook', 'book'], takeable: true,
    description: 'A Martian tablet showing the vault access code: "blue 4".',
  },
  vaultTerminal: {
    id: 'vaultTerminal', name: 'vault terminal', aliases: ['terminal', 'panel'], takeable: false,
    description: 'A second terminal that controls the steel door.',
  },
  steelDoor: {
    id: 'steelDoor', name: 'steel door', aliases: ['door'], takeable: false,
    description: 'A thick steel vault door.',
  },
  crystal: {
    id: 'crystal', name: 'crystal', aliases: ['radiant crystal', 'gem'], takeable: true,
    description: 'A radiant crystal humming with power. It feels important.',
  },
  sharpTool: {
    id: 'sharpTool', name: 'sharp tool', aliases: ['tool', 'blade'], takeable: true,
    description: 'A sharp Martian tool, light and dangerous.',
  },
  vaultAlien: {
    id: 'vaultAlien', name: 'vault alien', aliases: ['alien', 'guard'], takeable: false,
    description: 'A second alien, eyeing the tool in your hand.',
  },
};

export function getRoom(id) {
  return rooms[id];
}

export function getItem(id) {
  return items[id];
}

export function nounVocab() {
  const set = new Set();
  for (const item of Object.values(items)) {
    set.add(item.name);
    for (const a of item.aliases || []) set.add(a);
  }
  // common scenery/verbs-as-nouns
  ['visor', 'sand', 'symbols', 'code', 'hatch', 'open'].forEach((w) => set.add(w));
  return [...set];
}
