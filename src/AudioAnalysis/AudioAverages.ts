// Function to calculate averages
export const calculateAverages = (list) => {
    const averages = {};
    const numericKeys = Object.keys(list[0]).filter(
      key => typeof list[0][key] === 'number'
    );
  
    numericKeys.forEach(key => {
      averages[key] = list.reduce((acc, obj) => acc + obj[key], 0) / list.length;
    });
  
    return averages;
}
