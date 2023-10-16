import * as d3 from "d3";

function alphabeticalSort (a, b) {
  return a.localeCompare(b);
}
export function sourceAlphabeticalSort (a, b) {
  return alphabeticalSort(a.key, b.key);
}
export function targetNumericalIdSort (a, b) {
  return d3.ascending(parseInt(a.key), parseInt(b.target));
}
export function reverseSortResult (a, b, cmp) {
    return cmp(a, b) * -1;
}
