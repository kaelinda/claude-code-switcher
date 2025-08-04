import chalk from 'chalk';

// Enhanced color palette with better visual hierarchy
export const colors = {
  // Primary colors
  primary: chalk.hex('#6366f1'),      // Indigo
  secondary: chalk.hex('#8b5cf6'),    // Violet
  accent: chalk.hex('#06b6d4'),       // Cyan
  
  // Status colors
  success: chalk.hex('#10b981'),      // Emerald
  warning: chalk.hex('#f59e0b'),      // Amber
  error: chalk.hex('#ef4444'),        // Red
  info: chalk.hex('#3b82f6'),         // Blue
  
  // Neutral colors
  gray: chalk.hex('#6b7280'),         // Gray
  lightGray: chalk.hex('#9ca3af'),    // Light gray
  darkGray: chalk.hex('#374151'),     // Dark gray
  white: chalk.hex('#ffffff'),
  
  // Background colors
  bgSuccess: chalk.bgHex('#10b981').hex('#ffffff'),
  bgWarning: chalk.bgHex('#f59e0b').hex('#ffffff'),
  bgError: chalk.bgHex('#ef4444').hex('#ffffff'),
  bgInfo: chalk.bgHex('#3b82f6').hex('#ffffff'),
};

// Icons and symbols for better UX
export const icons = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
  star: '⭐',
  arrow: '→',
  check: '✓',
  cross: '✗',
  dot: '●',
  circle: '○',
  heart: '❤️',
  rocket: '🚀',
  settings: '⚙️',
  key: '🔑',
  link: '🔗',
  globe: '🌐',
  magic: '✨',
};

// Typography styles
export const typography = {
  title: (text: string) => colors.primary.bold(text),
  subtitle: (text: string) => colors.secondary(text),
  heading: (text: string) => colors.accent.bold(text),
  label: (text: string) => colors.gray.bold(text),
  value: (text: string) => colors.white(text),
  muted: (text: string) => colors.lightGray(text),
  highlight: (text: string) => colors.accent.italic(text),
};

// Box drawing characters for structured output
export const box = {
  topLeft: '┌',
  topRight: '┐',
  bottomLeft: '└',
  bottomRight: '┘',
  horizontal: '─',
  vertical: '│',
  leftT: '├',
  rightT: '┤',
  topT: '┬',
  bottomT: '┴',
  cross: '┼',
};

// Progress indicators
export const progress = {
  spinner: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
  bar: (current: number, total: number, width: number = 20) => {
    const percentage = Math.round((current / total) * 100);
    const filled = Math.round((current / total) * width);
    const empty = width - filled;
    
    const filledBar = colors.success('█'.repeat(filled));
    const emptyBar = colors.gray('░'.repeat(empty));
    
    return `${filledBar}${emptyBar} ${colors.primary(`${percentage}%`)}`;
  },
};

// Enhanced formatting utilities
export const format = {
  // Boxed text with border
  boxed: (text: string, title?: string) => {
    const width = Math.max(text.length + 4, title ? title.length + 6 : 0);
    const border = box.horizontal.repeat(width);
    
    let output = '';
    output += colors.primary(box.topLeft + border + box.topRight) + '\n';
    
    if (title) {
      const titlePadding = Math.floor((width - title.length - 2) / 2);
      const titleLine = ' '.repeat(titlePadding) + title + ' '.repeat(width - title.length - 2 - titlePadding);
      output += colors.primary(box.vertical) + colors.primary.bold(titleLine) + colors.primary(box.vertical) + '\n';
      output += colors.primary(box.leftT + border + box.rightT) + '\n';
    }
    
    const lines = text.split('\n');
    lines.forEach(line => {
      const padding = ' '.repeat(Math.max(0, width - line.length - 2));
      output += colors.primary(box.vertical) + ' ' + line + ' ' + padding + colors.primary(box.vertical) + '\n';
    });
    
    output += colors.primary(box.bottomLeft + border + box.bottomRight);
    return output;
  },
  
  // Status badges
  badge: (text: string, type: 'success' | 'warning' | 'error' | 'info') => {
    const bgColors = {
      success: colors.bgSuccess,
      warning: colors.bgWarning,
      error: colors.bgError,
      info: colors.bgInfo,
    };
    return bgColors[type](` ${text.toUpperCase()} `);
  },
  
  // Key-value pairs with consistent formatting
  keyValue: (key: string, value: string, icon?: string) => {
    const iconStr = icon ? `${icon} ` : '';
    return `${colors.gray.bold(iconStr + key + ':')} ${colors.white(value)}`;
  },
  
  // Provider card display
  providerCard: (provider: any, isCurrent: boolean = false) => {
    const header = isCurrent 
      ? colors.success.bold(`${icons.star} ${provider.name} (Current)`)
      : colors.primary.bold(`${icons.circle} ${provider.name}`);
    
    return [
      header,
      format.keyValue('Model', provider.model, icons.rocket),
      format.keyValue('Base URL', provider.base_url, icons.link),
      format.keyValue('API Key', provider.api_key.substring(0, 8) + '...', icons.key),
      ...(provider.headers ? [format.keyValue('Headers', Object.keys(provider.headers).join(', '), icons.settings)] : [])
    ].join('\n');
  },
  
  // Section headers
  section: (title: string) => 
    '\n' + colors.primary.bold(`${icons.magic} ${title}`) + '\n' + colors.gray('─'.repeat(title.length + 2)),
  
  // Error message with icon
  error: (message: string) => `${colors.error(icons.error)} ${colors.error.bold('Error:')} ${message}`,
  
  // Success message with icon
  success: (message: string) => `${colors.success(icons.success)} ${colors.success.bold('Success:')} ${message}`,
  
  // Warning message with icon
  warning: (message: string) => `${colors.warning(icons.warning)} ${colors.warning.bold('Warning:')} ${message}`,
  
  // Info message with icon
  info: (message: string) => `${colors.info(icons.info)} ${colors.info.bold('Info:')} ${message}`,
};

// Interactive prompt styling for inquirer
export const promptTheme = {
  prefix: colors.primary.bold('?'),
  pointer: colors.accent.bold('❯'),
  checked: colors.success(icons.check),
  unchecked: colors.gray(icons.circle),
  radio: {
    on: colors.success(icons.dot),
    off: colors.gray(icons.circle),
  },
  separator: colors.gray.dim('─'),
};

// Animation utilities
export const animate = {
  // Typewriter effect
  typewriter: async (text: string, delay: number = 30) => {
    for (let i = 0; i < text.length; i++) {
      process.stdout.write(text[i]);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    console.log();
  },
  
  // Fade in effect
  fadeIn: (text: string, color: string = 'primary') => {
    const colorFn = colors[color as keyof typeof colors] || colors.primary;
    return colorFn.bold(text);
  },
};

// Export for backward compatibility
export const chalkColors = colors;
export default {
  colors,
  icons,
  typography,
  box,
  progress,
  format,
  promptTheme,
  animate,
};