import { RESULT_TYPE_LABELS } from "@/components/search/search-ui.constants";

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

export function getResultTypeLabel(result: ResultWithRaw) {
  const rawType = getRawString(result, ["filetype", "documenttype", "objecttype"]);
  const normalizedType = rawType?.toLowerCase();

  if (!normalizedType) {
    return "Content";
  }

  return RESULT_TYPE_LABELS[normalizedType] ?? rawType;
}

export function getResultDateLabel(result: ResultWithRaw) {
  const rawDate = getRawString(result, ["date", "createddate", "modifieddate", "sysdate"]);

  if (!rawDate) {
    return undefined;
  }

  const parsedDate = new Date(rawDate);

  if (Number.isNaN(parsedDate.getTime())) {
    return rawDate;
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsedDate);
}

export function getResultTags(result: ResultWithRaw) {
  return [
    getRawString(result, ["source"]),
    getRawString(result, ["language"]),
    getRawString(result, ["author"]),
  ]
    .filter(isPresent)
    .slice(0, 3);
}
