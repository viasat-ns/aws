exports.handler = (event, context, callback) => {
	const { request } = event.Records[0].cf;
	var url = request.uri;
	var tvaccess = "access_token=s4DOQRDxVQv5NXmso1OJXOTqSMAjdDkJiUD7Sm0Itl9rCJgC1WGnD6UA6SYfPt7OeV%2FgR82cm%2BMzDI%2Bt8dTJyb%2BpHtVyz%2BO4njnIFoRkcXcifM87o%2B0JIAnc1ZRFFw8Fx0hdBr8IBqqMzHq9gP%2FpOg%3D%3D&user_key=8e9d27585351d980ed08021b572b310e";
	var view = "";
	
	if( url.includes( "/fsm-form/us/" ) )
	{
		view = "28";
	}
	else if( url.includes( "/fsm-form/br/" ) )
	{
		view = "188";
	}
	else if( url.includes( "/fsm-form/es/" ) )
	{
		view = "212";
	}
	else if( url.includes( "/fsm-form/mx/" ) )
	{
		view = "186";
	}
	
	request.uri = "/openapi/views/" + view + "/records";
	request.querystring = tvaccess;
	
	return callback(null, request);

};