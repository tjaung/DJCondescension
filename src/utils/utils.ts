import kmeans from "./kmeans";

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

export const convertHexToRGB = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: normalizeRGB(parseInt(result[1], 16)),
      g: normalizeRGB(parseInt(result[2], 16)),
      b: normalizeRGB(parseInt(result[3], 16))
    } : null;
  }
  
  export const normalizeRGB = ( value: number ) => {
    return value = (value - 0) / (255 - 0)
  }

export const getImageColors = (imageData: ImageData) => {
    const { data, width, height } = imageData;
    const pixelCount = width * height;
    // let rTotal = 0, gTotal = 0, bTotal = 0;
    const rgbValues = []
    for (let i = 0; i < data.length; i += 4) {
      const rgb = {
        r: data[i],
        g: data[i + 1],
        b: data[i + 2]
      }
      rgbValues.push(rgb)
    }
    return rgbValues
  };

  // Function to get the dominant colors
  export const getDominantColors = (imageData, k = 3) => {
    // Step 1: Extract RGB values
    const rgbValues = getImageColors(imageData);
  
    // Step 2: Prepare data for clustering (each entry should be [r, g, b])
    const data = rgbValues.map(rgb => [rgb.r, rgb.g, rgb.b]);
  
    // Step 3: Run K-means clustering (use k-means++ initialization for better results)
    const { centroids } = kmeans(data, k, true); // true for k-means++ initialization
  
    // Step 4: Convert the centroids to RGB values (rounding to integer), darkening by a percentage
    const darkeningPerc = 0.9 // reduce by 10%
    let dominantColors = centroids.map(centroid => {
      return {
        r: normalizeRGB(Math.round(centroid[0])) * darkeningPerc,
        g: normalizeRGB(Math.round(centroid[1])) * darkeningPerc,
        b: normalizeRGB(Math.round(centroid[2]) * darkeningPerc)
      };
    });
    
    // sort by brightness
    const out = sortByBrightness(dominantColors)
    return out;
  };
  

  const findBiggestColorRange = (rgbValues) => {
    let rMin = Number.MAX_VALUE;
    let gMin = Number.MAX_VALUE;
    let bMin = Number.MAX_VALUE;
  
    let rMax = Number.MIN_VALUE;
    let gMax = Number.MIN_VALUE;
    let bMax = Number.MIN_VALUE;
  
    rgbValues.forEach((pixel) => {
      rMin = Math.min(rMin, pixel.r);
      gMin = Math.min(gMin, pixel.g);
      bMin = Math.min(bMin, pixel.b);
  
      rMax = Math.max(rMax, pixel.r);
      gMax = Math.max(gMax, pixel.g);
      bMax = Math.max(bMax, pixel.b);
    });
  
    const rRange = rMax - rMin;
    const gRange = gMax - gMin;
    const bRange = bMax - bMin;
  
    const biggestRange = Math.max(rRange, gRange, bRange);
    if (biggestRange === rRange) {
      return "r";
    } else if (biggestRange === gRange) {
      return "g";
    } else {
      return "b";
    }
  };

export const quantization = (rgbValues, depth) => {

  const MAX_DEPTH = 4;
    if (depth === MAX_DEPTH || rgbValues.length === 0) {
      const color = rgbValues.reduce(
        (prev, curr) => {
          prev.r += curr.r;
          prev.g += curr.g;
          prev.b += curr.b;
  
          return prev;
        },
        {
          r: 0,
          g: 0,
          b: 0,
        }
      );
  
      color.r = normalizeRGB(Math.round(color.r / rgbValues.length));
      color.g = normalizeRGB(Math.round(color.g / rgbValues.length));
      color.b = normalizeRGB(Math.round(color.b / rgbValues.length));
      return [color];
    }
    const componentToSortBy = findBiggestColorRange(rgbValues);
    rgbValues.sort((p1, p2) => {
      return p1[componentToSortBy] - p2[componentToSortBy];
    });
  
    const mid = rgbValues.length / 2;
    return [
      ...quantization(rgbValues.slice(0, mid), depth + 1),
      ...quantization(rgbValues.slice(mid + 1), depth + 1),
    ];
  }
  
export const rgbToHsl = (r, g, b) => {
    r /= 255, g /= 255, b /= 255;
  
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;
  
    if (max == min) {
      h = s = 0; // achromatic
    } else {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
  
      h /= 6;
    }
  
    return [ h, s, l ];
  }

  export const sortByBrightness = (arr) => {
    let lightnessSort = [];
    for (let i = 0; i < arr.length; i++) {
      const hsl = [rgbToHsl(arr[i].r, arr[i].g, arr[i].b)[2], arr[i]];
      lightnessSort.push(hsl);
    }
  
    // Sort colors based on lightness (HSL)
    lightnessSort.sort(sortByHSL);
  
    // Get first, midpoint, and last colors
    const midpoint = Math.round(lightnessSort.length / 2);
    const first = lightnessSort[0][1];
    const mid = lightnessSort[midpoint][1];
    const last = lightnessSort[arr.length - 1][1];
    const choices = [first, mid, last];
  
    return choices;
  };
  

function sortByHSL(a, b) {
  return a[0] - b[0];
}