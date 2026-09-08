// Shuffle-bag randomizer (kiểu "7-bag" của Tetris): xáo trộn toàn bộ pool rồi phát
// lần lượt, hết bộ mới xáo lại — đảm bảo 1 phần tử không lặp lại cho tới khi mọi
// phần tử khác trong pool đã xuất hiện đủ 1 lần. Giảm cảm giác lặp từ so với
// Math.random() thuần (có thể ra cùng 1 từ liên tiếp).
export interface ShuffleBag<T> {
  next(): T;
}

export function createShuffleBag<T>(items: T[]): ShuffleBag<T> {
  let bag: T[] = [];

  function refill() {
    bag = [...items];
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
  }

  return {
    next(): T {
      if (bag.length === 0) refill();
      return bag.pop() as T;
    },
  };
}
