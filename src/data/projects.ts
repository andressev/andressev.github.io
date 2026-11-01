// All portfolio content lives here. Each tab shows the projects whose `tab` matches.
// Media paths are relative to /public (the base URL is prepended in the component).

export type TabId = 'academic' | 'gamedev' | 'publicity';

export const tabs: { id: TabId; label: string }[] = [
  { id: 'academic', label: 'Academic' },
  { id: 'gamedev', label: 'Game Dev' },
  { id: 'publicity', label: 'Publicity' },
];

export type Link = { label: string; href: string };

export type Project = {
  tab: TabId;
  /** small label above the title, e.g. RESEARCH */
  kind: string;
  title: string;
  year?: string;
  /** one string per paragraph */
  description: string | string[];
  tags?: string[];
  links?: Link[];
  /** looping muted video (preferred) */
  video?: string;
  /** still image, or the poster frame for `video` */
  image?: string;
  /** YouTube video played in place (click to load); `aspect` is the video's own shape,
   *  so the player is sized to it and shows no black bars (default 16 / 9) */
  youtube?: { id: string; aspect?: string };
  /** more stills shown under the main image/video */
  extra?: { src: string; caption?: string }[];
  /** small round icon pinned to the corner of the image (e.g. a VR headset) */
  badge?: { src: string; label: string };
  /** transparent image laid over this project's block, e.g. media/textures/lightning-ink.png */
  texture?: string;
  /** external image URL (used as-is, no base prefix) */
  remoteImage?: string;
  /** larger layout: full-width image on top, wide text column below */
  featured?: boolean;
  /** recorded talk: small thumbnail that links to the video */
  talk?: { href: string; thumb: string; label: string; note?: string };
  /** "Learn more" panel: longer write-up plus the rest of the images.
   *  Order: text → figure → after → list → gallery (all but text/gallery optional) */
  more?: {
    text: string[];
    figure?: { src: string; caption: string };
    after?: string[];
    /** named items, e.g. the engine's simulations; `name` is shown in mono */
    list?: { name: string; text: string }[];
    gallery: { src: string; full: string; caption: string }[];
  };
};

export const projects: Project[] = [
  // ── Academic ────────────────────────────────────────────
  {
    tab: 'academic',
    kind: 'Thesis · Research software',
    title: 'Dynamical Systems Engine',
    year: '2026',
    featured: true,
    description:
      "For my thesis I took on the task of studying the main streams of current in nonlinear dynamical systems, the stable and unstable manifolds of equilibria. In general dynamical systems have no closed solutions, so building the manifolds is practically impossible without numerical methods; however, they are very useful since they help you understand the global dynamics of the system. To be able to transmit the information without burying it in algebra, and for the implementation of the numerical methods, I made a completely interactive visualization and simulation engine from scratch using C++ and OpenGL. Both my goal and my advisor's is to polish the engine so it can be easily installed, so mathematicians around the world can use it to visualize mathematics, especially dynamical systems.",
    image: 'media/dse/lorenz_manifold_growth_20261028_152344.jpg',
    links: [{ label: 'Repository', href: 'https://github.com/andressev/DynamicalSystems_engine' }],
    talk: {
      href: 'https://www.youtube.com/watch?v=Lr9teRVQWVg',
      thumb: 'https://i.ytimg.com/vi/Lr9teRVQWVg/mqdefault.jpg',
      label: 'Watch the talk I gave at ITAM University using the engine',
    },
    more: {
      text: [
        'The main idea behind the thesis is computing global (un)stable manifolds: the sets of trajectories that converge to an equilibrium as t → −∞ or t → +∞. These sets have no closed-form representation at all, so they can only be computed numerically. Using a scheme of numerical methods, mainly the parametrization method and geodesic level sets, they are computed precisely.',
        'The engine is a way to constructively visualize and build all of these methods, showing the visual ideas behind the algebra.',
      ],
      figure: { src: 'media/dse/simulation-menu.png', caption: 'Simulation menu' },
      after: [
        'The engine uses a modular system: each simulation is independent of the others and is attached individually. Simulations use modules, separate components I have built throughout the course of my thesis that can be attached to any simulation.',
        'I also attached two Claude Code skills, sim and module, so anyone without programming skills can create both using just mathematical language.',
        'The simulations built so far:',
      ],
      list: [
        { name: 'vector_field', text: 'Has a function parser, so you can plug in any vector field and see how single trajectories or chunks of them evolve.' },
        { name: 'diagonal_linear', text: 'A simulation generalizing how systems associated with hyperbolic matrices behave.' },
        { name: 'lorenz_flow', text: 'Shows the Lorenz flow and its equilibria, and how the linear dynamics in the neighborhood of a point relate to the nonlinear ones.' },
        { name: 'lorenz_equilibrium', text: 'A concrete case of the Hartman–Grobman theorem, where I built the homeomorphism using the parametrization method.' },
        { name: 'lorenz_manifold_growth', text: 'Lets you start growing the local manifolds and the global manifold.' },
        { name: 'geodesic_level_sets', text: 'Implements the geodesic level sets algorithm, which grows the local manifold in a controlled fashion to visualize the intricate dynamics of the Lorenz system.' },
      ],
      gallery: [
        { src: 'media/dse/vector_field_r2_20261018_200519-sm.jpg', full: 'media/dse/vector_field_r2_20261018_200519.jpg', caption: 'Pendulum with friction' },
        { src: 'media/dse/vector_field_r3_20261016_190213-sm.jpg', full: 'media/dse/vector_field_r3_20261016_190213.jpg', caption: 'Thomas system' },
        { src: 'media/dse/lorenz_equilibrium_20261016_215240-sm.jpg', full: 'media/dse/lorenz_equilibrium_20261016_215240.jpg', caption: 'Neighborhood around an equilibrium' },
        { src: 'media/dse/lorenz_equilibrium_20261018_200143-sm.jpg', full: 'media/dse/lorenz_equilibrium_20261018_200143.jpg', caption: 'Hartman–Grobman visualization' },
        { src: 'media/dse/lorenz_manifold_growth_20261028_152230-sm.jpg', full: 'media/dse/lorenz_manifold_growth_20261028_152230.jpg', caption: 'Lorenz manifold' },
        { src: 'media/dse/vector_field_r3_20261015_214043-sm.jpg', full: 'media/dse/vector_field_r3_20261015_214043.jpg', caption: 'Lorenz flow' },
      ],
    },
  },
  {
    tab: 'academic',
    kind: 'Research',
    title: 'Circular Restricted Three-Body Problem',
    year: '2026',
    description: [
      'Real-time simulation of a massless particle moving under two bodies in circular orbit. A numerical integrator traces the trajectories while the background maps the energy level of every point on screen, so Hill regions and Lagrange points become visible. Accompanied by a formal paper introducing the CR3BP.',
      "The CR3BP is a conservative system with a four-dimensional phase space: the particle's position and velocity in the plane. Its conserved energy (the Jacobi constant) splits that space into energy levels, three-dimensional surfaces that act as invariant manifolds: a particle that starts on an energy level must stay on it forever. Since these structures live in 4D, the program shows them through slices, coloring every point on screen by the energy it would have at the particle's current velocity.",
    ],
    tags: ['Celestial Mechanics', 'Numerical Integration', 'Unity', 'C#'],
    links: [{ label: 'Read paper', href: 'media/celestial-mechanics.pdf' }],
    video: 'media/cr3bp.mp4',
    extra: [{ src: 'media/cr3bp-orbits.jpg', caption: 'Trajectories around the Lagrange points' }],
    image: 'media/cr3bp-poster.jpg',
  },

  // ── Game Dev ────────────────────────────────────────────
  {
    tab: 'gamedev',
    kind: 'Shipped · Apple Arcade',
    title: 'Pocket City 2+',
    year: '2024',
    description:
      "Pocket City 2 was a famous building tycoon game on the appstore, when Apple Arcade chose them to be the next game on their plattform many changes and features had to be integrated to the game. I led the technical integration: designed an automatic cross-device iCloud backup and recovery system, implemented platform-specific functionality across iOS, macOS and tvOS, and brought the full experience up to Apple's certification standards.",
    tags: ['Unity', 'C#', 'Apple Arcade', 'Cross-Platform', 'external plugins', 'Backend', 'memory managment'],
    links: [
      { label: 'App Store', href: 'https://apps.apple.com/us/app/pocket-city-2/id1533709428' },
      { label: 'Steam', href: 'https://store.steampowered.com/app/3566200/Pocket_City_2/' },
    ],
    remoteImage: 'https://github.com/user-attachments/assets/d5c2dac6-6979-4c55-90ae-14df5ae64b75',
  },
  {
    tab: 'gamedev',
    kind: 'Shipped · Apple Arcade',
    title: 'Farmside',
    year: '2024',
    description:
      'Delivered a major update for Farmside, another large-scale Apple Arcade title. Production at this scale means every change touches thousands of users, extreme care, fast execution, and tight deadlines.',
    tags: ['Unity', 'C#', 'Apple Arcade', 'Production'],
    links: [{ label: 'Farmside', href: 'https://farmsidegame.com/' }],
    remoteImage: 'https://github.com/user-attachments/assets/0f7c4a1b-c1e5-4a70-bebc-40ec1bd7e252',
  },
  {
    tab: 'gamedev',
    kind: 'UI systems',
    title: 'Moshpit',
    year: '2024',
    description:
      'Designed and implemented a portion of the UI system for Moshpit. The project required mastering Unity Addressables,  async asset bundle loading, runtime instantiation, and memory management.',
    tags: ['Unity', 'C#', 'UI Systems', 'Addressables', 'Runtime Asset Loading'],
    image: 'media/moshpit-ui.jpg',
  },
  {
    tab: 'gamedev',
    kind: 'GPU simulation',
    title: 'GridSpace',
    description:
      'Cellular automata made in Unity using compute shaders and pingpong buffers. Users can create multiple rules that acts as genes for the cellular automata and mutate them into new states.',
    tags: ['HLSL', 'GPU Compute', 'Parallel Simulation', 'Procedural Generation', 'C#'],
    links: [
      { label: 'GitHub', href: 'https://github.com/andressev/GridSpacee' },
      { label: 'Video', href: 'https://www.youtube.com/watch?v=BqFUAaOdQgY' },
    ],
    video: 'media/gridspace1.mp4',
    image: 'media/gridspace1.jpg',
  },

  // ── Publicity ───────────────────────────────────────────
  {
    tab: 'publicity',
    kind: 'Client work · TouchDesigner',
    title: 'Promotional video for La D0minatrix clothing store',
    description:
      'This project was particularly refreshing because I could use all the techniques I learned, such as raymarching, volumetric raymarching, lighting, camera movement and animation, in a creative project where I could let go of the rigorous numerics for a surreal interactive reality where the clothing store lived. The whole project is simulated in real time, of course: it lives in TouchDesigner and is controlled from a MIDI keyboard, from the rain to the thunder to the atmosphere and the camera. The final product is a video to be posted on social media.',
    tags: ['TouchDesigner', 'Raymarching', 'Volumetrics', 'MIDI', 'Real-time'],
    youtube: { id: 'OF37AVNoP0o', aspect: '9 / 16' },
    texture: 'media/textures/lightning-ink.png',
  },
  {
    tab: 'publicity',
    kind: 'Architectural visualization',
    title: 'VR Interior Design Experience',
    description:
      'Real-time VR walkthroughs for an interior design firm, built in Unity HDRP with physically based reflections, area lights and hybrid baked/real-time GI.',
    tags: ['Unity', 'HDRP', 'VR'],
    youtube: { id: 'Z-_uE-FxvDI' },
    badge: { src: 'media/icons/vr-headset.svg', label: 'VR' },
  },
];
