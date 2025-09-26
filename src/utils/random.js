export function shuffleArray(array) {
  const shuffled = array.slice();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function pickN(array, n) {
  const a = array.slice();
  const res = [];
  while (res.length < n && a.length) {
    const i = Math.floor(Math.random() * a.length);
    res.push(a.splice(i, 1)[0]);
  }
  return res;
}

