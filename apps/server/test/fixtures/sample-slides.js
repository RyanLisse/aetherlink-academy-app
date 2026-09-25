/* Synthetic fixture — not the classroom deck. Covers named layouts for importer tests. */
window.SLIDES = [
  {title: 'Welcome', type: 'context', cards: [{title: 'Hello', body: 'World'}], notes: 'speaker'},
  {title: 'Pillars', type: 'concept', layout: 'pillars', items: [{label: 'Useful'}, {label: 'Safe'}]},
  {title: 'Steps', type: 'concept', layout: 'steps', items: [{label: 'Read', caption: 'First'}]},
  {title: 'Compare', type: 'concept', layout: 'compare', columns: [{title: 'A', items: ['one']}, {title: 'B', items: ['two']}]},
  {title: 'Exercise', type: 'practice', layout: 'exercise', steps: ['Do it'], timer: 25, expected: 'done', check: 'tests green'},
  {title: 'Recap', type: 'recap', layout: 'recap', items: [{label: 'Remember'}]},
  {title: 'Cards', type: 'concept', layout: 'cards', cards: [{title: 'Plan', body: 'Design first'}]},
  {title: 'Image', type: 'context', layout: 'image', image: 'diagram.svg', imageAlt: 'diagram', imageCaption: 'caption', keepCards: true, cards: []},
  {title: 'Bars', type: 'concept', layout: 'bars', bars: {stages: [{name: 'Plan', w: 10}, {name: 'Build', w: 40, accent: true}], scale: 'relative', caption: 'Build dominates'}},
];
