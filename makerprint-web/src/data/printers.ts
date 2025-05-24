
export type PrinterStatus = 'printing' | 'idle' | 'disconnected' | 'error';

export const files = [
  'benchy.gcode',
  'calibration_cube.gcode',
  'phone_stand.gcode',
  'raspberry_case.gcode',
  'drawer_organizer.gcode',
  'ASX1_corne-choc-plate-one-side.gcode',
  'noir.gcode',
  'ASX1_corne-case-both-sides.gcode',
  'ASX1_allhardwareparts_gear32mm.gcode',
  'ASX1_hinge cover test.gcode',
  'bleu.gcode',
  'WD12230D_Support_Mur_-_Stop.gcode',
  'ASX1_Coque.gcode'
]


export interface Printer {
  id: string;
  name: string;
  status: PrinterStatus;
  nozzleTemp: {
    current: number;
    target: number;
  };
  bedTemp: {
    current: number;
    target: number;
  };
  currentFile?: string;
  progress?: number;
  layerHeight?: number;
  timeRemaining?: number;
}

// Mock data for printers
export const printers: Printer[] = [
  {
    id: '1',
    name: 'Mock Printer 0',
    status: 'printing',
    nozzleTemp: {
      current: 210,
      target: 210
    },
    bedTemp: {
      current: 60,
      target: 60
    },
    currentFile: 'benchy.gcode',
    progress: 45,
    layerHeight: 0.2,
    timeRemaining: 120,
  },
  {
    id: '2',
    name: 'Mock Printer 1',
    status: 'idle',
    nozzleTemp: {
      current: 25,
      target: 0
    },
    bedTemp: {
      current: 25,
      target: 0
    },
  },
  {
    id: '3',
    name: 'Mock Printer 2',
    status: 'disconnected',
    nozzleTemp: {
      current: 0,
      target: 0
    },
    bedTemp: {
      current: 0,
      target: 0
    },
  },
  {
    id: '4',
    name: 'Mock Printer 3',
    status: 'printing',
    nozzleTemp: {
      current: 195,
      target: 195
    },
    bedTemp: {
      current: 50,
      target: 50
    },
    currentFile: 'bleu.gcode',
    progress: 78,
    layerHeight: 0.15,
    timeRemaining: 45,
  },
  {
    id: '5',
    name: 'Mock Printer 4',
    status: 'error',
    nozzleTemp: {
      current: 150,
      target: 200
    },
    bedTemp: {
      current: 65,
      target: 65
    },
    currentFile: 'complex_part.gcode',
    progress: 23,
    layerHeight: 0.1,
    timeRemaining: 0,
  },
  {
    id: '6',
    name: 'Maxime = GROS ZIZI',
    status: 'printing',
    nozzleTemp: {
      current: 210,
      target: 210
    },
    bedTemp: {
      current: 60,
      target: 60
    },
    currentFile: 'phone_stand.gcode',
  }
];
