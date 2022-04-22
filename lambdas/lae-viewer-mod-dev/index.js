exports.handler = async (event, context) => {
    const response = event.Records[0].cf.response;
    const headers = response.headers;

    delete response.headers['x-frame-options'];

    const headerRP = 'Referrer-Policy';
    headers[headerRP.toLowerCase()] = [{
      key: headerRP,
      value: 'strict-origin-when-cross-origin',
    }];

    const headerCustom = 'lae-version';
    headers[headerCustom.toLowerCase()] = [{
      key: headerCustom,
      value: 'version-2',
    }];

    return response;
};
