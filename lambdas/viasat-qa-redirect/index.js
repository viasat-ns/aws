exports.handler = async (event) => {
    // TODO implement
    const redirect = {
        status: '301',
        statusDescription: 'Moved Permanently',
        headers: {
            location: [{
                key: 'Location',
                value: 'https://www.viasat.com/en-qa/',
            }],
            "x-viasat-fwd": [{
                key: 'X-Viasat-FWD',
                value: "domain redirect",
            }]
        },
    };


    return redirect;
}