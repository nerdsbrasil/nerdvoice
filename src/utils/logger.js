const COLORS = {
  reset: '\x1b[0m',
  gray: '\x1b[90m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

const DOMAIN_COLORS = {
  BOT: COLORS.magenta,
  DATABASE: COLORS.cyan,
  CALL: COLORS.green,
  PAINEL: COLORS.blue,
  CHAT: COLORS.yellow,
  SEGURANCA: COLORS.yellow,
  ERRO: COLORS.red,
};

function line(domain, username, message) {
  const color = DOMAIN_COLORS[domain] ?? COLORS.cyan;
  const timestamp = new Date().toLocaleTimeString('pt-BR');
  return `${COLORS.gray}[${timestamp}]${COLORS.reset} ${color}[${domain}][${username}]${COLORS.reset} ${message}`;
}

export const logger = {
  info(domain, username, message) {
    console.log(line(domain, username, message));
  },
  error(username, message, error) {
    console.error(line('ERRO', username, `${message}${error?.message ? ` — ${error.message}` : ''}`));
  },
};
