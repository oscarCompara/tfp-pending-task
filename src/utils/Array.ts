export const groupBy = (arr: any[], property: string): Record<string, number> => {
  console.log("group by", arr);
  return arr.reduce((acc: Record<string, number>, obj: any) => {
    const key = obj[property];
    if (!acc[key]) {
      acc[key] = 0;
    }
    acc[key] += 1;
    return acc;
  }, {});
}
