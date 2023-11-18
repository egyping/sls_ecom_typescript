import { EventBridgeEvent } from 'aws-lambda';

import Dynamo from '@libs/Dynamo';
import { OrderRecord, ProductsRecord } from 'src/types/dynamo';
import axios from 'axios';
import Secrets from '@libs/secrets';

// function triggered order.placed event to inform the warehouse about the items which should be picked 

export const handler = async (event: EventBridgeEvent<'string', OrderRecord>) => {
  try {
    const details = event.detail;

    const authKey = await Secrets.getSecret('warehouseApiKey');

    await axios.post(
      'https://httpstat.us/201',
      {
        ...details,
      },
      {
        headers: {
          authorization: authKey,
        },
      }
    );

    console.log('warehouse API called');

    return;
  } catch (error) {
    console.error(error);
  }
};