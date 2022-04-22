exports.handler = async (event, context) => {
    const response = event.Records[0].cf.response;
    const headers = response.headers;

//SHA256 Pin of stage: I92nqKO6cgS1Gx4O4s+YbHuyyF6IX3n894ph9mpYSYQ=
//SHA256 Pin of prod: cvv+hcZ+EP7Do1cnMVIRLqJHXFl7tjgRqpSm34h/DTk=

    const headerPKP = 'Public-Key-Pins';
    headers[headerPKP.toLowerCase()] = [{
      key: headerPKP,
      value: 'max-age=1296000; pin-sha256="cvv+hcZ+EP7Do1cnMVIRLqJHXFl7tjgRqpSm34h/DTk="; pin-sha256="I92nqKO6cgS1Gx4O4s+YbHuyyF6IX3n894ph9mpYSYQ="',
    }];

    const headerHSTS = 'Strict-Transport-Security';
    headers[headerHSTS.toLowerCase()] = [{
      key: headerHSTS,
      value: 'max-age=31536000',
    }];
    
    const headerXSS = 'X-XSS-Protection';
    headers[headerXSS.toLowerCase()] = [{
      key: headerXSS,
      value: '1; mode=block',
    }];
    
    const headerRP = 'Referrer-Policy';
    headers[headerRP.toLowerCase()] = [{
      key: headerRP,
      value: 'strict-origin-when-cross-origin',
    }];

    return response;
};
