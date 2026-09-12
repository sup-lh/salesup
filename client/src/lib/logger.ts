export const logger = {
  error(message: string, error?: unknown) {
    emit('error', message, error);
  },
  warn(message: string, details?: unknown) {
    emit('warn', message, details);
  },
  info(message: string, details?: unknown) {
    emit('info', message, details);
  },
};

function emit(level: string, message: string, details?: unknown) {
  const sink = (globalThis as { __APP_LOGGER__?: (entry: { level: string; message: string; details?: unknown }) => void }).__APP_LOGGER__;
  sink?.({ level, message, details });
}
