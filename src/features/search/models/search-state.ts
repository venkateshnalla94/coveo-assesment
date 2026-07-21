import type { SearchQuery, SearchResponse } from "@/features/search/models/search-models";

export type SearchState =
  | { status: "initial"; query: SearchQuery }
  | { status: "loading"; query: SearchQuery; previousResponse?: SearchResponse }
  | { status: "success"; query: SearchQuery; response: SearchResponse }
  | { status: "empty"; query: SearchQuery; response: SearchResponse }
  | { status: "error"; error: string; query: SearchQuery; previousResponse?: SearchResponse };

export type SearchStateAction =
  | { type: "search-requested"; query: SearchQuery }
  | { type: "search-succeeded"; response: SearchResponse }
  | { type: "search-failed"; error: string };

export function searchStateReducer(state: SearchState, action: SearchStateAction): SearchState {
  switch (action.type) {
    case "search-requested":
      return {
        status: "loading",
        query: action.query,
        ...("response" in state ? { previousResponse: state.response } : {}),
      };
    case "search-succeeded":
      return {
        status: action.response.results.length === 0 ? "empty" : "success",
        query: state.query,
        response: action.response,
      };
    case "search-failed":
      return {
        status: "error",
        error: action.error,
        query: state.query,
        ...("response" in state ? { previousResponse: state.response } : {}),
      };
  }
}

export function getSearchStateResponse(state: SearchState) {
  if ("response" in state) {
    return state.response;
  }

  if ("previousResponse" in state) {
    return state.previousResponse;
  }

  return undefined;
}
