export async function loadJson(path){const r=await fetch(path);if(!r.ok)throw new Error(`Unable to load ${path}`);return r.json()}
export const n=x=>Number(x).toFixed(3);
