export default function VoiceModeIntro({ onStart }) {
  const ReactGlobal = globalThis.React;
  if (!ReactGlobal) {
    throw new Error('React global was not found. Make sure the React bundle is loaded before rendering VoiceModeIntro.');
  }

  const { createElement } = ReactGlobal;

  return createElement('main', {
    className: 'min-h-screen flex items-center justify-center bg-emerald-950'
  }, createElement('button', {
    onClick: onStart,
    className: 'px-12 py-8 text-3xl md:text-5xl font-extrabold rounded-[2.5rem] bg-emerald-400 text-emerald-950 hover:bg-emerald-300 focus:outline-none focus-visible:ring-8 focus-visible:ring-emerald-200 shadow-[0_20px_40px_rgba(16,185,129,0.35)] transition'
  }, 'Начать'));
}
