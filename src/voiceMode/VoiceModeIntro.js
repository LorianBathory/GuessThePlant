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
    className: 'px-12 py-8 text-3xl md:text-5xl font-extrabold bg-[#C29C27] text-emerald-950 focus:outline-none'
  }, 'Начать'));
}
