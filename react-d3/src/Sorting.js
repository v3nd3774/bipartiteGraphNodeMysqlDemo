import * as d3 from "d3";

function alphabeticalSort (a, b) {
  return a.localeCompare(b);
}
function sourceAlphabeticalSort (a, b) {
  return alphabeticalSort(a.key, b.key);
}
function targetNumericalIdSort (a, b) {
  return d3.ascending(parseInt(a.key), parseInt(b.key));
}
function reverseSortResult (a, b, cmp) {
    return cmp(a, b) * -1;
}
export const lhsAvailibleSorting = {
    "alphabetical labeler": sourceAlphabeticalSort,
    "reverse alphabetical labeler": (a, b) => reverseSortResult(a, b, sourceAlphabeticalSort)
}
export const rhsAvailibleSorting = {
    "numerical id": targetNumericalIdSort,
    "reverse numerical id": (a, b) => reverseSortResult(a, b, targetNumericalIdSort)
}
