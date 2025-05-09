
export type ColorPaletteDefinition = {
  [variableName: string]: string; // HSL string e.g., "0 0% 100%"
};

export type ColorPalette = {
  name: string;
  id: string;
  light: ColorPaletteDefinition;
  dark: ColorPaletteDefinition;
};

export const zenithDefaultPalette: ColorPalette = {
  name: "Zenith Default",
  id: "zenith-default",
  light: {
    '--background': '40 100% 96%',
    '--foreground': '30 15% 20%',
    '--card': '40 100% 95%',
    '--card-foreground': '30 15% 20%',
    '--popover': '40 100% 93%',
    '--popover-foreground': '30 15% 20%',
    '--primary': '15 70% 55%',
    '--primary-foreground': '40 100% 97%',
    '--secondary': '30 15% 20%',
    '--secondary-foreground': '40 100% 96%',
    '--muted': '35 60% 90%',
    '--muted-foreground': '30 10% 45%',
    '--accent': '15 75% 60%',
    '--accent-foreground': '40 100% 97%',
    '--destructive': '0 60% 50%',
    '--destructive-foreground': '0 0% 98%',
    '--border': '35 25% 85%',
    '--input': '40 100% 95%',
    '--ring': '15 70% 60%',
  },
  dark: {
    '--background': '30 15% 10%',
    '--foreground': '40 100% 90%',
    '--card': '30 15% 12%',
    '--card-foreground': '40 100% 90%',
    '--popover': '30 15% 15%',
    '--popover-foreground': '40 100% 90%',
    '--primary': '15 70% 65%',
    '--primary-foreground': '30 15% 10%',
    '--secondary': '40 100% 90%',
    '--secondary-foreground': '30 15% 10%',
    '--muted': '30 15% 20%',
    '--muted-foreground': '40 100% 70%',
    '--accent': '15 75% 70%',
    '--accent-foreground': '30 15% 10%',
    '--destructive': '0 60% 55%',
    '--destructive-foreground': '0 0% 98%',
    '--border': '30 15% 25%',
    '--input': '30 15% 12%',
    '--ring': '15 70% 65%',
  }
};

export const deepSeaPalette: ColorPalette = {
  name: "Deep Sea",
  id: "deep-sea",
  light: {
    '--background': '180 10% 95%',
    '--foreground': '195 30% 20%',
    '--card': '180 10% 92%',
    '--card-foreground': '195 30% 20%',
    '--popover': '180 10% 90%',
    '--popover-foreground': '195 30% 20%',
    '--primary': '195 28% 35%',
    '--primary-foreground': '180 20% 95%',
    '--secondary': '180 22% 67%',
    '--secondary-foreground': '195 30% 15%',
    '--muted': '180 15% 88%',
    '--muted-foreground': '195 30% 40%',
    '--accent': '124 28% 53%',
    '--accent-foreground': '180 20% 95%',
    '--destructive': '0 60% 50%',
    '--destructive-foreground': '0 0% 98%',
    '--border': '180 15% 80%',
    '--input': '180 10% 92%',
    '--ring': '124 28% 53%',
  },
  dark: {
    '--background': '195 28% 13%',
    '--foreground': '180 20% 90%',
    '--card': '195 28% 16%',
    '--card-foreground': '180 20% 90%',
    '--popover': '195 28% 18%',
    '--popover-foreground': '180 20% 90%',
    '--primary': '124 28% 53%',
    '--primary-foreground': '180 20% 95%',
    '--secondary': '180 22% 67%',
    '--secondary-foreground': '195 30% 10%',
    '--muted': '195 28% 20%',
    '--muted-foreground': '180 20% 70%',
    '--accent': '180 30% 75%',
    '--accent-foreground': '195 30% 10%',
    '--destructive': '0 63% 40%',
    '--destructive-foreground': '0 0% 98%',
    '--border': '195 28% 22%',
    '--input': '195 28% 16%',
    '--ring': '124 28% 53%',
  }
};

export const forestMistPalette: ColorPalette = {
  name: "Forest Mist",
  id: "forest-mist",
  light: {
    '--background': '100 20% 95%',
    '--foreground': '120 25% 25%',
    '--card': '100 20% 92%',
    '--card-foreground': '120 25% 25%',
    '--popover': '100 20% 90%',
    '--popover-foreground': '120 25% 25%',
    '--primary': '130 40% 45%',
    '--primary-foreground': '90 50% 95%',
    '--secondary': '90 30% 65%',
    '--secondary-foreground': '120 25% 20%',
    '--muted': '100 20% 88%',
    '--muted-foreground': '120 25% 45%',
    '--accent': '140 35% 55%',
    '--accent-foreground': '90 50% 95%',
    '--destructive': '0 60% 50%',
    '--destructive-foreground': '0 0% 98%',
    '--border': '100 15% 80%',
    '--input': '100 20% 92%',
    '--ring': '130 40% 45%',
  },
  dark: {
    '--background': '120 15% 15%',
    '--foreground': '90 30% 85%',
    '--card': '120 15% 18%',
    '--card-foreground': '90 30% 85%',
    '--popover': '120 15% 20%',
    '--popover-foreground': '90 30% 85%',
    '--primary': '130 45% 55%',
    '--primary-foreground': '120 15% 10%',
    '--secondary': '90 25% 45%',
    '--secondary-foreground': '90 30% 90%',
    '--muted': '120 15% 22%',
    '--muted-foreground': '90 30% 70%',
    '--accent': '140 40% 60%',
    '--accent-foreground': '120 15% 10%',
    '--destructive': '0 55% 50%',
    '--destructive-foreground': '0 0% 98%',
    '--border': '120 15% 28%',
    '--input': '120 15% 18%',
    '--ring': '130 45% 55%',
  }
};

export const AVAILABLE_PALETTES: ColorPalette[] = [
  zenithDefaultPalette,
  deepSeaPalette,
  forestMistPalette,
];

export const THEME_VARIABLES_LIST = [
  '--background', '--foreground',
  '--card', '--card-foreground',
  '--popover', '--popover-foreground',
  '--primary', '--primary-foreground',
  '--secondary', '--secondary-foreground',
  '--muted', '--muted-foreground',
  '--accent', '--accent-foreground',
  '--destructive', '--destructive-foreground',
  '--border', '--input', '--ring',
];
