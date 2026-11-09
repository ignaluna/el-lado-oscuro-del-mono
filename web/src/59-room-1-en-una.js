// Floor 1 · «En una» · chapter 1 · a reality simulated by a computer: the cover, walkable.
// (For now the machine's screen opens the floor's plate; the puzzle in the room itself comes next.)
ROOMS['en-una'] = {
  aim: { x: 0, y: 2.2, z: 10, sx: 0.42, sy: 0.4 },
  intro: 'La data baja desde arriba. La ilusión de elegir. El algoritmo ya está escrito.',
  hots: {
    'rm-screen': { label: () => Trial.label(), tap: () => Trial.open() },
  },
};
