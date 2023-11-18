import { EventBridgeEvent } from 'aws-lambda';

import Dynamo from '@libs/Dynamo';
import { OrderRecord } from 'src/types/dynamo';
import axios from 'axios';
import Secrets from '@libs/secrets';

export const handler = async (event: EventBridgeEvent<'string', OrderRecord>) => {
  try {
    const details = event.detail;

    const authKey = await Secrets.getSecret('deliveryApiKey');

    const deliveryData = await generateDeliveryData(details);

    await axios.post('https://httpstat.us/201', deliveryData, {
      headers: {
        authorization: authKey,
      },
    });

    console.log('delivery request sent to the DSP');

    return;
  } catch (error) {
    console.error(error);
  }
};
// need to pass the customer data too , get the details type of order record 
const generateDeliveryData = async (details: OrderRecord) => {
  const { userId, id } = details;
  console.log(userId);
  console.log(id);
  console.log(details);

  // get the user address from dynamo userAddressTable (there is no user address just pretend)
  const userAddress = await Dynamo.get({
    pkValue: userId,
    tableName: process.env.userAddressTable,
  });
  // from where it will be collected 
  const warehouseAddress = {
    firstLine: '12 Jones Ave',
    city: 'Manchester',
    postcode: 'M34 5KD',
  };

  return {
    deliveryAddress: userAddress,
    pickupAddress: warehouseAddress,
    deliveryType: 'standard',
    readyForCollection: true,
    meta: {
      id,
      userId,
    },
  };
};