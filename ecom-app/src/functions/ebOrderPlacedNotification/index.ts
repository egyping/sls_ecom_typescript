import { EventBridgeEvent } from 'aws-lambda';

import Dynamo from '@libs/Dynamo';
import { OrderRecord, ProductsRecord } from 'src/types/dynamo';
import SES from '@libs/SES';

// the function wil be triggered by EventBridge to notify the user
// so the event has to be EventBridgeEvent, wr are receiving string in format of the order record
// we will use SES so at libs we need to create SES client
export const handler = async (event: EventBridgeEvent<'string', OrderRecord>) => {
  try {
    const productsTable = process.env.productTable;
    // getting the details from the event
    const details = event.detail;
    // to get the items details from the event detaiuls
    const itemPromises = details.items.map(async (item) => {
      const itemData = await Dynamo.get<ProductsRecord>({
        tableName: productsTable,
        pkValue: item.id,
      });
      return {
        // quantity order from the details without query the product table 
        count: item.count,
        title: itemData.title,
        // get the avaialble sizes and the exact ordered size
        size: itemData.sizesAvailable.find((size) => size.sizeCode == item.size),
      };
    });
    const itemDetails = await Promise.all(itemPromises);
    // send the email 
    await SES.sendEmail({
      email: details.userEmail,
      subject: 'Your order has been placed',
      text: `Thank you for placing your order. We're preparing it at our warehouse.
      
            Your order is for 
            ${itemDetails.map(itemToRow)}

            We'll let you know when that has been shipped!
            `,
    });
    console.log('sent email');
    return;
  } catch (error) {
    console.error(error);
  }
};
// forming the items in noce readable way
const itemToRow = ({
  count,
  title,
  size,
}: {
  count: number;
  title: string;
  size?: { sizeCode: number; displayValue: string };
}) => {
    // if no size return null for size 
  return `${count} ${title} ${size ? `in size ${size.displayValue}` : null}
`;
};