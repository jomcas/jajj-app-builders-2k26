// This module's own UI text. Pure data with no imports (see src/i18n/types.ts).
// {name} placeholders are filled in with fill() from ./format.

const en = {
  gateTitle: 'The Assistant needs its model',
  gateBody: 'The Assistant runs on your phone, with no signal. It needs a one-time download first.',
  sizeNote: 'About {size}. Wi-Fi recommended.',
  statusMissing: 'Not downloaded yet',
  statusDownloading: 'Downloading: {done} of {total} ({percent}%)',
  statusPaused: 'Paused at {done} of {total} ({percent}%)',
  statusError: 'Download stopped at {done} of {total}. Tahak tries again in a few seconds.',
  statusReady: 'The Assistant model is ready.',
  errorDetail: 'Reason: {message}',
  download: 'Download',
  pause: 'Pause',
  resume: 'Resume',
  retryNow: 'Try again now',
  keepsRunning: 'The download keeps going while you use the other tabs. Keep Tahak open until it is done.',
  progressLabel: 'Download progress',
  testSource: 'Test download (developer mode)',
};

const fil: Record<keyof typeof en, string> = {
  gateTitle: 'Kailangan muna ng Assistant ang model nito',
  gateBody: 'Tumatakbo ang Assistant sa phone mo, kahit walang signal. Kailangan muna itong i-download nang isang beses.',
  sizeNote: 'Mga {size}. Mas mabuti kung naka-Wi-Fi.',
  statusMissing: 'Hindi pa na-download',
  statusDownloading: 'Dina-download: {done} sa {total} ({percent}%)',
  statusPaused: 'Naka-pause sa {done} sa {total} ({percent}%)',
  statusError: 'Huminto ang download sa {done} sa {total}. Susubukan ulit ng Tahak maya-maya.',
  statusReady: 'Handa na ang model ng Assistant.',
  errorDetail: 'Dahilan: {message}',
  download: 'I-download',
  pause: 'I-pause',
  resume: 'Ituloy',
  retryNow: 'Subukan ulit ngayon',
  keepsRunning: 'Tuloy ang download habang gamit mo ang ibang tab. Huwag isara ang Tahak hangga\'t hindi tapos.',
  progressLabel: 'Progreso ng download',
  testSource: 'Test na download (para sa developer)',
};

export default { en, fil };
