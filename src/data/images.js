export const plantImages = Object.freeze([
  { id: 'p001', plantId: 1, src: 'images/BeachDaisy.JPG' },
  { id: 'p002', plantId: 2, src: 'images/MoonCarrot.JPG' },
  { id: 'p003', plantId: 3, src: 'images/Agapanthus.JPG' },
  { id: 'p004', plantId: 4, src: 'images/bougainvillea.JPG' },
  { id: 'p005', plantId: 5, src: 'images/camelia.JPG' },
  { id: 'p006', plantId: 6, src: 'images/Gerbera.JPG' },
  { id: 'p007', plantId: 17, src: 'images/Clematis_Medium.JPG' },
  { id: 'p008', plantId: 19, src: 'images/Oleandr_Medium_GabrielBodhi.JPG' },
  { id: 'p009', plantId: 22, src: 'images/Tulip_Easy_PavelDanilyuk.JPG' },
  { id: 'p010', plantId: 26, src: 'images/images/Dahlia_Easy.JPG' },
  { id: 'p011', plantId: 26, src: 'images/Dahlia_Medium.JPG' },
  { id: 'p012', plantId: 27, src: 'images/Echinacea_AlexasFotos.JPG' },
  { id: 'p013', plantId: 29, src: 'images/Chrysanthemum_Easy_AliefBaldwin.JPG' },
  { id: 'p014', plantId: 29, src: 'images/Chrysanthemum_Medium_Hartono Subagio.JPG' },
  { id: 'p015', plantId: 30, src: 'images/Osteospermum.JPG' },
  { id: 'p016', plantId: 31, src: 'images/RoseEasy_HartonoSubagio.JPG' },
  { id: 'p017', plantId: 31, src: 'images/Rose_Easy_JÉSHOOTS.JPG' },
  { id: 'p018', plantId: 31, src: 'images/Rose_Hard.JPG' },
  { id: 'p019', plantId: 32, src: 'images/Guzmania.JPG' },
  { id: 'p020', plantId: 33, src: 'images/Poppy.JPG' },
  { id: 'p021', plantId: 33, src: 'images/Poppy_Medium.JPG' },
  { id: 'p022', plantId: 34, src: 'images/Pohutukawa.JPG' },
  { id: 'p023', plantId: 35, src: 'images/Lily.JPG' },
  { id: 'p024', plantId: 41, src: 'images/Dianthus.JPG' },
  { id: 'p025', plantId: 46, src: 'images/Peony_Medium_IrinaIriser.JPG' },
  { id: 'p026', plantId: 47, src: 'images/Anemone_Medium_CatalinM.JPG' },
  { id: 'p027', plantId: 47, src: 'images/Anemone_Medium_NikoD.JPG' },
  { id: 'p028', plantId: 50, src: 'images/Jacaranda.JPG' },
  { id: 'p029', plantId: 51, src: 'images/Pomegranate.JPG' },
  { id: 'p030', plantId: 52, src: 'images/Pittosporum.JPG' },
  { id: 'p031', plantId: 53, src: 'images/Scabious.JPG' },
  { id: 'p032', plantId: 54, src: 'images/Lantana.JPG' },
  { id: 'p033', plantId: 55, src: 'images/Hibiscus.JPG' },
  { id: 'p034', plantId: 55, src: 'images/Hibiscus2.JPG' },
  { id: 'p035', plantId: 55, src: 'images/Hibiscus3.JPG' },
  { id: 'p036', plantId: 68, src: 'images/Lavender_Medium_StuartRobinson.JPG' },
  { id: 'p037', plantId: 69, src: 'images/Eustoma.JPG' },
  { id: 'p038', plantId: 73, src: 'images/Aster_Medium_HartonoSubagio.JPG' },
  { id: 'p039', plantId: 75, src: 'images/Syringa_JuliaFilirovska.JPG' },
  { id: 'p040', plantId: 77, src: 'images/Rhodomyrtus.JPG' },
  { id: 'p041', plantId: 78, src: 'images/Solanum_Hard.JPG' },
  { id: 'p042', plantId: 79, src: 'images/Plumbago.JPG' }
]);

export const plantImagesById = Object.freeze(
  Object.fromEntries(plantImages.map(image => [image.id, image]))
);

export function getImagesByPlantId(plantId) {
  return plantImages.filter(image => image.plantId === plantId);
}
