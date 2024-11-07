export const pickRandomNSongs = (n: number, arr: any[]) => {
    const out = [];
    const copyArr = [...arr];

    for (let i = 0; i < n && i < copyArr.length; i++) {
        const randomIndex = Math.floor(Math.random() * copyArr.length);
        out.push(copyArr.splice(randomIndex, 1)[0]);
    }
    return out;
}

export const getRandomNumberRange = (min: number, max: number) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }