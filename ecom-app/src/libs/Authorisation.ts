import { APIGatewayProxyEvent } from 'aws-lambda';
import Secrets from './secrets';

// we are sending the event to the apiKeyAuth and the event has the authentication data in the header
const apiKeyAuth = async (event: APIGatewayProxyEvent) => {
    // check if there is header in the event or not
  if (!event.headers?.Authorization) {
    throw Error('Missing Authorisation header');
  }

// this is how the   Authorization exist in the API gateway request 
//   "Authorization": [
//     "Bearer eyJraWQiOiJLTzRVMThJ..."
//   ]
  const authToken = event.headers.Authorization;
// format it and get the exact path as each group of paths has its own path 
  const formattedPath = event.resource.replaceAll('{', '_').replaceAll('}', '_');
// get the exact secret from our .env though libs\secrets > seceret manager & handle the case if the API key not found
  const secretString = await Secrets.getSecret(`auth-${formattedPath}`);
  if (!secretString) {
    throw Error('no API key found for this path');
  }
  // secretString is array of secrets not only one secret as formattedPath got the initial resourse which
  // considered or refer to the group of secrets has initiail not all the secrets
  const secretObj = JSON.parse(secretString);
  // secretObj looks like 
    // {
    //     warehouseA: "keyA",
    //     warehouseB: "keyB",
    // }
  // now we have array of secrets secretObj and now we will filter to the exact key passed in the event authToken
  // if the key one of them just return else throw error 
  if (Object.values(secretObj).includes(authToken)) {
    return;
  }
  throw Error('invalid API Key');
};

const Authorisation = {
  apiKeyAuth,
};
export default Authorisation;