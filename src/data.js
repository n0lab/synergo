export const mediaLibrary = [
  {
    id: 'vid-1',
    type: 'video',
    title: 'Salutation discrète',
    tags: ['R_C_E_3_1', 'R_C_E_3_2'],
    annotations: [
      { time: 0.8, label: 'R_C_E_3_1' },
      { time: 2.4, label: 'R_C_E_3_2' },
      { time: 4.1, label: 'R_C_E_4_0' },
    ],
    src:
      'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    description: 'Inclinaison de la tête marquant un salut poli et mesuré.',
    fps: 30,
  },
  {
    id: 'vid-2',
    type: 'video',
    title: 'Agitation défensive',
    tags: ['R_D_B_1_0', 'R_D_B_2_3'],
    annotations: [
      { time: 0.5, label: 'R_D_B_1_0' },
      { time: 1.9, label: 'R_D_B_2_3' },
      { time: 3.2, label: 'R_D_B_2_4' },
    ],
    src:
      'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    description: 'Bras croisés accompagnés d’un recul du buste, signal d’auto-protection.',
    fps: 30,
  },
  {
    id: 'photo-1',
    type: 'photo',
    title: 'Main sur le cœur',
    tags: ['R_H_C_1_0', 'R_H_C_1_1'],
    src:
      'https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d?auto=format&fit=crop&w=1200&q=80',
    description: 'Geste associé à l’assurance de bonne foi.',
  },
  {
    id: 'photo-2',
    type: 'photo',
    title: 'Regard fuyant',
    tags: ['R_R_F_0_1', 'R_R_F_0_2'],
    src:
      'https://images.unsplash.com/photo-1463453091185-61582044d556?auto=format&fit=crop&w=900&q=80',
    description: 'Les yeux évitent le contact, marque d’inconfort.',
  },
];
