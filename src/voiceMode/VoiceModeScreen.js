import useSecureImageSource from '../hooks/useSecureImageSource.js';
import { useVoiceAnnouncements } from './useVoiceAnnouncements.js';

function VoicePlantImage({ src, alt }) {
  const ReactGlobal = globalThis.React;
  if (!ReactGlobal) {
    throw new Error('React global was not found. Make sure the React bundle is loaded before rendering VoicePlantImage.');
  }

  const { createElement } = ReactGlobal;
  const { secureSrc, status } = useSecureImageSource(src);

  if (!src) {
    return null;
  }

  if (status === 'error') {
    return createElement('div', {
      className: 'w-full flex items-center justify-center bg-emerald-950 text-emerald-200 rounded-xl h-64 md:h-80',
      role: 'status'
    }, 'Изображение недоступно');
  }

  if (status !== 'ready' || !secureSrc) {
    return createElement('div', {
      className: 'w-full flex items-center justify-center bg-emerald-950 rounded-xl h-64 md:h-80',
      role: 'status'
    }, createElement('span', { className: 'sr-only' }, 'Загрузка изображения'));
  }

  return createElement('img', {
    src: secureSrc,
    alt,
    className: 'w-full h-64 md:h-80 object-cover rounded-xl shadow-lg',
    draggable: false,
    onContextMenu: event => event?.preventDefault?.(),
    onDragStart: event => event?.preventDefault?.()
  });
}

export default function VoiceModeScreen({
  questionNumber,
  options,
  onAnswer,
  gameState,
  currentPlant
}) {
  const ReactGlobal = globalThis.React;
  if (!ReactGlobal) {
    throw new Error('React global was not found. Make sure the React bundle is loaded before rendering VoiceModeScreen.');
  }

  const { createElement } = ReactGlobal;
  useVoiceAnnouncements({ questionNumber, options, gameState });
  const isInteractionLocked = gameState !== 'playing';

  return createElement('div', {
    className: 'w-full max-w-6xl mx-auto flex flex-col items-center gap-10'
  }, [
    currentPlant && currentPlant.image && createElement(VoicePlantImage, {
      key: 'image',
      src: currentPlant.image,
      alt: currentPlant?.ru ? `Растение: ${currentPlant.ru}` : 'Фотография растения'
    }),
    createElement('section', {
      key: 'options',
      className: 'grid grid-cols-1 md:grid-cols-2 gap-6 w-full',
      role: 'group',
      'aria-label': 'Варианты ответов'
    }, options.map((option, index) => createElement('button', {
      key: option.id,
      onClick: () => onAnswer(option.id),
      disabled: isInteractionLocked,
      className: 'flex items-center justify-center rounded-[2rem] border-4 border-emerald-500 bg-emerald-900/80 px-8 py-10 text-left shadow-[0_12px_30px_rgba(6,95,70,0.45)] focus:outline-none focus-visible:ring-8 focus-visible:ring-emerald-300 transition transform hover:scale-[1.01] disabled:opacity-60 disabled:cursor-not-allowed',
      style: { fontSize: '2.75rem', lineHeight: 1.2 }
    }, `${index + 1}. ${option.label}`)))
  ]);
}
