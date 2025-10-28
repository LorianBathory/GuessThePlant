import {
  plantNamesById,
  speciesById,
  plantImages,
  bouquetQuestions,
  plants
} from '../game/dataLoader.js';
import { memorizationPlants } from '../data/memorization/memorizationCatalog.js';
import useSecureImageSource from '../hooks/useSecureImageSource.js';

function isMeaningfulString(value) {
  if (typeof value !== 'string') {
    return false;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }
  return trimmed.toLowerCase() !== 'free';
}

function hasAssignedName(names) {
  if (!names || typeof names !== 'object') {
    return false;
  }
  return Object.values(names).some(isMeaningfulString);
}

function formatPercentage(value, total) {
  if (!total || total <= 0 || value < 0) {
    return null;
  }
  const ratio = (value / total) * 100;
  if (!Number.isFinite(ratio)) {
    return null;
  }
  const rounded = Math.round(ratio * 10) / 10;
  return `${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1)}%`;
}

function MetricCard({ title, value, details, progress, highlight = false }) {
  const ReactGlobal = globalThis.React;
  if (!ReactGlobal) {
    throw new Error('React global was not found.');
  }
  const { createElement } = ReactGlobal;

  return createElement('div', {
    className: `metric-card${highlight ? ' highlight-card' : ''}`
  }, [
    createElement('dt', { key: 'title' }, title),
    createElement('dd', { key: 'value', className: 'metric-value' }, value),
    details ? createElement('p', { key: 'details', className: 'metric-details' }, details) : null,
    typeof progress === 'number' && progress >= 0
      ? createElement('div', { key: 'progress', className: 'metric-progress-track' },
        createElement('div', {
          className: 'metric-progress-bar',
          style: { width: `${Math.max(0, Math.min(1, progress)) * 100}%` }
        })
      )
      : null
  ]);
}

function RandomPlantShowcase({ plant, onShuffle, poolSize }) {
  const ReactGlobal = globalThis.React;
  if (!ReactGlobal) {
    throw new Error('React global was not found.');
  }
  const { createElement, useMemo } = ReactGlobal;
  const imageSrc = plant && typeof plant.image === 'string' ? plant.image : null;
  const { secureSrc, status } = useSecureImageSource(imageSrc);

  const ruName = plant && plant.names ? (isMeaningfulString(plant.names.ru) ? plant.names.ru.trim() : null) : null;
  const enName = plant && plant.names ? (isMeaningfulString(plant.names.en) ? plant.names.en.trim() : null) : null;
  const sciName = plant && plant.names ? (isMeaningfulString(plant.names.sci) ? plant.names.sci.trim() : null) : null;

  const caption = useMemo(() => {
    if (!plant) {
      return null;
    }
    return createElement('div', { className: 'random-plant-caption' }, [
      ruName ? createElement('strong', { key: 'ru' }, ruName) : null,
      enName ? createElement('span', { key: 'en' }, enName) : null,
      sciName ? createElement('span', { key: 'sci' }, sciName) : null,
      createElement('span', { key: 'id' }, `ID: ${plant.id}`)
    ].filter(Boolean));
  }, [plant, ruName, enName, sciName, createElement]);

  let figureContent;
  if (!plant) {
    figureContent = createElement('div', { className: 'placeholder' }, 'Нет изображения');
  } else if (status === 'error') {
    figureContent = createElement('div', { className: 'placeholder' }, 'Не удалось загрузить фото');
  } else if (status !== 'ready' || !secureSrc) {
    figureContent = createElement('div', { className: 'placeholder' }, 'Загрузка...');
  } else {
    figureContent = createElement('img', {
      src: secureSrc,
      alt: ruName || enName || sciName || `Растение ${plant.id}`,
      draggable: false,
      onContextMenu: event => {
        if (event && typeof event.preventDefault === 'function') {
          event.preventDefault();
        }
      },
      onDragStart: event => {
        if (event && typeof event.preventDefault === 'function') {
          event.preventDefault();
        }
      }
    });
  }

  return createElement('section', { className: 'random-plant-card' }, [
    createElement('figure', { key: 'figure', className: 'random-plant-figure' }, [
      figureContent,
      caption
    ]),
    createElement('div', { key: 'info', className: 'random-plant-info' }, [
      createElement('h2', { key: 'title' }, 'Случайное фото из каталога'),
      createElement('p', { key: 'count' }, poolSize > 0
        ? `Выбрано из ${poolSize} доступных карточек с изображениями.`
        : 'В каталоге пока нет изображений.'),
      plant && plant.difficulty
        ? createElement('p', { key: 'difficulty' }, `Уровень сложности: ${plant.difficulty}`)
        : null,
      createElement('div', { key: 'actions', className: 'random-plant-actions' }, [
        createElement('button', {
          key: 'shuffle',
          type: 'button',
          className: 'progress-button',
          onClick: () => {
            if (typeof onShuffle === 'function') {
              onShuffle();
            }
          }
        }, 'Обновить фото'),
        createElement('a', {
          key: 'play',
          className: 'progress-button progress-button-secondary',
          href: '../index.html'
        }, 'Открыть викторину')
      ])
    ])
  ]);
}

export default function ProgressApp() {
  const ReactGlobal = globalThis.React;
  if (!ReactGlobal) {
    throw new Error('React global was not found. Ensure React UMD bundle is loaded.');
  }

  const {
    createElement,
    useMemo,
    useState,
    useCallback,
    useEffect
  } = ReactGlobal;

  const plantNameEntries = useMemo(
    () => Object.values(plantNamesById || {}),
    []
  );
  const namedPlantCount = useMemo(() => plantNameEntries.filter(hasAssignedName).length, [plantNameEntries]);
  const totalPlantNameSlots = plantNameEntries.length;

  const speciesList = useMemo(
    () => Object.values(speciesById || {}),
    []
  );
  const totalSpecies = speciesList.length;

  const validImageIdSet = useMemo(() => new Set(
    Array.isArray(plantImages)
      ? plantImages.map(image => image && typeof image.id === 'string' ? image.id : null).filter(Boolean)
      : []
  ), []);

  const speciesWithPhotos = useMemo(() => speciesList.filter(species => (
    Array.isArray(species?.images)
      ? species.images.some(imageId => validImageIdSet.has(imageId))
      : false
  )), [speciesList, validImageIdSet]);
  const speciesWithPhotosCount = speciesWithPhotos.length;

  const plantPool = useMemo(() => (
    Array.isArray(plants)
      ? plants.filter(plant => plant && typeof plant.image === 'string')
      : []
  ), []);
  const plantPoolSize = plantPool.length;

  const [randomIndex, setRandomIndex] = useState(() => (
    plantPool.length > 0
      ? Math.floor(Math.random() * plantPool.length)
      : -1
  ));

  useEffect(() => {
    if (plantPoolSize === 0) {
      setRandomIndex(-1);
      return;
    }
    if (randomIndex < 0 || randomIndex >= plantPoolSize) {
      setRandomIndex(Math.floor(Math.random() * plantPoolSize));
    }
  }, [plantPoolSize, randomIndex]);

  const shufflePlant = useCallback(() => {
    if (plantPoolSize === 0) {
      setRandomIndex(-1);
      return;
    }
    if (plantPoolSize === 1) {
      setRandomIndex(0);
      return;
    }
    let nextIndex = Math.floor(Math.random() * plantPoolSize);
    let guard = 0;
    while (nextIndex === randomIndex && guard < 6) {
      nextIndex = Math.floor(Math.random() * plantPoolSize);
      guard += 1;
    }
    setRandomIndex(nextIndex);
  }, [plantPoolSize, randomIndex]);

  const selectedPlant = randomIndex >= 0 && randomIndex < plantPoolSize
    ? plantPool[randomIndex]
    : null;

  const memoPlants = Array.isArray(memorizationPlants) ? memorizationPlants.length : 0;
  const bouquetCount = Array.isArray(bouquetQuestions) ? bouquetQuestions.length : 0;
  const imagesCount = Array.isArray(plantImages) ? plantImages.length : 0;

  const metrics = useMemo(() => {
    const namedPercentage = formatPercentage(namedPlantCount, totalPlantNameSlots);
    const photoCoverage = formatPercentage(speciesWithPhotosCount, totalSpecies);
    const memorizationCoverage = formatPercentage(memoPlants, totalSpecies);

    return [
      {
        key: 'named-plants',
        title: 'Растения с именами',
        value: totalPlantNameSlots > 0
          ? `${namedPlantCount} / ${totalPlantNameSlots}`
          : `${namedPlantCount}`,
        details: namedPercentage ? `${namedPercentage} слотов каталога заполнены.` : 'Пока нет заполненных карточек.',
        progress: totalPlantNameSlots > 0 ? namedPlantCount / totalPlantNameSlots : null,
        highlight: true
      },
      {
        key: 'photo-plants',
        title: 'Растения с фотографиями',
        value: totalSpecies > 0
          ? `${speciesWithPhotosCount} / ${totalSpecies}`
          : `${speciesWithPhotosCount}`,
        details: photoCoverage ? `Покрытие галереи: ${photoCoverage}` : 'Нет видов с изображениями.',
        progress: totalSpecies > 0 ? speciesWithPhotosCount / totalSpecies : null
      },
      {
        key: 'bouquet-questions',
        title: 'Вопросы про букеты',
        value: String(bouquetCount),
        details: bouquetCount > 0
          ? 'Готовые сценарии подборов букетов.'
          : 'Еще предстоит добавить вопросы.'
      },
      {
        key: 'memorization',
        title: 'Растения в режиме заучивания',
        value: totalSpecies > 0 ? `${memoPlants} / ${totalSpecies}` : String(memoPlants),
        details: memorizationCoverage ? `Доступно для тренировки: ${memorizationCoverage}` : 'Пока нет подключенных растений.',
        progress: totalSpecies > 0 ? memoPlants / totalSpecies : null
      },
      {
        key: 'image-library',
        title: 'Всего фотографий в библиотеке',
        value: String(imagesCount),
        details: imagesCount > 0
          ? 'Включая альтернативные ракурсы.'
          : 'Изображения еще не загружены.'
      }
    ];
  }, [
    namedPlantCount,
    totalPlantNameSlots,
    speciesWithPhotosCount,
    totalSpecies,
    bouquetCount,
    memoPlants,
    imagesCount
  ]);

  return createElement('div', { className: 'progress-wrapper' },
    createElement('div', { className: 'progress-content' }, [
      createElement('header', { key: 'header', className: 'progress-header' }, [
        createElement('h1', { key: 'title', className: 'progress-heading' }, 'Прогресс каталога растений'),
        createElement('p', { key: 'subtitle', className: 'progress-subtitle' }, 'Следите за тем, как наполняется коллекция: сколько растений уже имеют описания, фотографии и поддерживают разные режимы игры.')
      ]),
      createElement(RandomPlantShowcase, {
        key: 'random-plant',
        plant: selectedPlant,
        onShuffle: shufflePlant,
        poolSize: plantPoolSize
      }),
      createElement('dl', { key: 'metrics', className: 'metrics-grid' },
        metrics.map(metric => createElement(MetricCard, {
          key: metric.key,
          title: metric.title,
          value: metric.value,
          details: metric.details,
          progress: metric.progress,
          highlight: metric.highlight
        }))
      )
    ])
  );
}
