function timeRangeFilter(d, config){
    return config.filterConf.timeRanges.every(function (range) {
        const lhs = range[0]
        const rhs = range[1]
        function padStart(i) {
            return i.toString().padStart(2, "0")
        }
        const timeStr = [
            d.timeParsed.getHours(),
            d.timeParsed.getMinutes(),
            d.timeParsed.getSeconds()
        ].map(padStart).join(':')
        return lhs <= timeStr && rhs >= timeStr
    })
}
export function genTRFilter(config) {
    return (function (d) { return timeRangeFilter(d, config) })
}
function datetimeRangeFilter(d, config){
    return config.filterConf.datetimeRanges.every(function (range) {
        const lhs = range[0]
        const rhs = range[1]
        return lhs <= d.timeParsed && rhs >= d.timeParsed
    })
}
export function genDTRFilter(config) {
    return (function (d) { return datetimeRangeFilter(d, config) })
}
