import * as d3 from "d3";

function alphabeticalSort (a, b) {
  return a.localeCompare(b);
}
function sourceAlphabeticalSort (a, b) {
  return alphabeticalSort(a.key, b.key);
}
function sourceQualitySort (a, b) {
  return d3.ascending(
        a.values[0].original.user_quality_score,
        b.values[0].original.user_quality_score
  );
}
function freqs (xs) {
    const counts = {};
    for (const x of xs) {
      counts[x] = counts[x] ? counts[x] + 1 : 1;
    }
    return counts
}
function targetLabelSort (a, b) {

  const aLabels = a.values.map(d => (d.original.label ? d.original.label : 'ERROR NO LABEL DATA').toString())
  const bLabels = b.values.map(d => (d.original.label ? d.original.label : 'ERROR NO LABEL DATA').toString())
  const aFreqs = freqs(aLabels)
  const bFreqs = freqs(bLabels)
  // https://www.30secondsofcode.org/js/s/most-frequent-array-element/#:~:text=1%20Use%20Array.prototype.reduce%20%28%29%20to%20map%20unique%20values,get%20the%20most%20frequent%20value%20in%20the%20array.
  const astr = Object.entries(aFreqs).reduce((a, v) => (v[1] >= a[1] ? v : a), [null, 0])[0]
  const bstr = Object.entries(bFreqs).reduce((a, v) => (v[1] >= a[1] ? v : a), [null, 0])[0]
  return astr.localeCompare(bstr)
}
function targetNumericalIdSort (a, b) {
  return d3.ascending(parseInt(a.key), parseInt(b.key));
}
function reverseSortResult (a, b, cmp) {
    return cmp(a, b) * -1;
}
export const lhsAvailibleSorting = {
    "alphabetical labeler": sourceAlphabeticalSort,
    "reverse alphabetical labeler": (a, b) => reverseSortResult(a, b, sourceAlphabeticalSort),
    "ascending labeler quality score": sourceQualitySort,
    "descending labeler quality score": (a, b) => reverseSortResult(a, b, sourceQualitySort)
}
export const rhsAvailibleSorting = {
    "numerical id": targetNumericalIdSort,
    "reverse numerical id": (a, b) => reverseSortResult(a, b, targetNumericalIdSort),
    "label consensus": targetLabelSort,
    "reverse label consensus":  (a, b) => reverseSortResult(a, b, targetLabelSort)
}
