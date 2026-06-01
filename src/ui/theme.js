export const UITheme = {
  colors: {
    navy950: 0x020812,
    navy900: 0x04111f,
    navy800: 0x071827,
    navy700: 0x0b2b48,
    navy600: 0x113a58,
    cyan400: 0x6db7d4,
    cyan300: 0x9ee8ff,
    brass700: 0x8a5a24,
    brass600: 0x9c6b2f,
    brass500: 0xb98232,
    gold500: 0xd7a748,
    gold300: 0xf6d37c,
    gold100: 0xfff0bf,
    emerald500: 0x38c986,
    danger600: 0x7a2632,
    danger400: 0xff6d5e,
    whiteText: 0xfff5d6
  },
  css: {
    goldText: '#fff0bf',
    goldTextStrong: '#f8d77a',
    bodyText: '#d9fbff',
    mutedText: '#9fb8c8',
    dangerText: '#ffe2cc',
    navyShadow: '#020812'
  },
  fonts: {
    title: 'Georgia, "Times New Roman", serif',
    body: 'Arial, sans-serif',
    button: 'Georgia, "Times New Roman", serif'
  },
  radius: {
    panel: 14,
    button: 10,
    small: 7
  },
  depth: {
    background: 0,
    panel: 20,
    ui: 50,
    modal: 800,
    toast: 900
  }
};

export const ButtonVariants = {
  primary: {
    fill: UITheme.colors.navy800,
    fill2: UITheme.colors.navy600,
    glow: UITheme.colors.gold500,
    border: UITheme.colors.brass600,
    text: UITheme.css.goldTextStrong
  },
  secondary: {
    fill: UITheme.colors.navy900,
    fill2: UITheme.colors.navy700,
    glow: UITheme.colors.cyan400,
    border: UITheme.colors.brass600,
    text: '#f2d48a'
  },
  ready: {
    fill: 0x083326,
    fill2: 0x0d5a3e,
    glow: UITheme.colors.emerald500,
    border: UITheme.colors.gold500,
    text: '#e9ffd8'
  },
  danger: {
    fill: 0x35111a,
    fill2: UITheme.colors.danger600,
    glow: UITheme.colors.danger400,
    border: UITheme.colors.brass600,
    text: UITheme.css.dangerText
  },
  disabled: {
    fill: 0x1d2732,
    fill2: 0x27313b,
    glow: 0x56616e,
    border: 0x6b7280,
    text: '#9aa6b2'
  }
};
