type RawValue = string | number | boolean | string[] | number[] | null | undefined;
type ResultWithRaw = { raw: object };

function isPresent(value: string | undefined): value is string {
  return Boolean(value);
}

export function getRawString(result: ResultWithRaw, keys: string[]) {
  const raw = result.raw as Record<string, RawValue>;

  for (const key of keys) {
    const value = raw[key];

    if (typeof value === "string" && value.trim()) {
      return value;
    }

    if (Array.isArray(value) && typeof value[0] === "string" && value[0].trim()) {
      return value[0];
    }
  }

  return undefined;
}

export function getThumbnail(result: ResultWithRaw) {
  return getRawString(result, ["thumbnailuri", "thumbnail", "image", "imageurl"]);
}

export function getMeta(result: ResultWithRaw) {
  return [
    getRawString(result, ["source"]),
    getRawString(result, ["filetype", "documenttype"]),
    getRawString(result, ["author"]),
  ].filter(isPresent);
}
