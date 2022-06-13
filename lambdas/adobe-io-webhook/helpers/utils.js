
function getQueryParam(query, param) {
    if (typeof query == "undefined") return;

    var vars = query.split('&');
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split('=');
        if (decodeURIComponent(pair[0]) == param) {
            return decodeURIComponent(pair[1]);
        }
    }
    console.log('Query param %s not found', param);
}

const exportFunctions = {
  getQueryParam
}

module.exports = {
  exportFunctions
}
