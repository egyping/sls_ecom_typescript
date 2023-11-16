
import { DynamoDBStreamEvent } from 'aws-lambda';
import {
    EventBridgeClient,
    PutEventsCommand,
    PutEventsCommandInput,
    PutEventsRequestEntry,
  } from '@aws-sdk/client-eventbridge';
  // npm i -S @aws-sdk/util-dynamodb
  import { unmarshall } from '@aws-sdk/util-dynamodb';
  import { AttributeValue } from '@aws-sdk/client-dynamodb';

const client = new EventBridgeClient({});
const eventBrigeBusName = process.env.eventBrigeBusName;

// This handler will be triggered by dunamodb stream event not api gateway
// lambda will be executed\triggered by dynamodbstream when new order get placed 
export const handler = async (event: DynamoDBStreamEvent) => {
    
    try {
        // get the new record data, its array so we need map and map each record 
        // so ebEvents is array of record(s)
        const ebEvents = event.Records.map((record) => {
            // if no record passed
            if (!record?.dynamodb?.NewImage) {
              return null;
            }
            // create even variable to be sent by response variable
            const event = recordToEvent(record);
            return event;
          })

          // print the records to the console
          console.log(ebEvents);

          // create the parameters, use the command which will pass through the EB SDK client 
          const params: PutEventsCommandInput = {
            Entries: ebEvents,
          };
          const command = new PutEventsCommand(params);
          // send the command to EB
          const response = await client.send(command);
          // log the EB response to check if succeded 
          console.log(response);

          return

    } catch (error) {
        console.log('error', error)
    }}
    // recordToEvent is forming the pattern of the event in EB style 
    const recordToEvent = (record: DynamoDBStreamEvent['Records'][0]) => {
        const statusToSource = {
        placed: 'order.placed',
        packed: 'order.packed',
        delivered: 'order.delivered',
        error: 'order.error',
        };
        
        // change the format received from dynamodb from marshall 
        const data = unmarshall(record.dynamodb.NewImage as Record<string, AttributeValue>);
        
        // 
        const [tableArn] = record.eventSourceARN.split('/stream');

        // forming and new event in event bridge 
        const event: PutEventsRequestEntry = {
            Time: new Date(record?.dynamodb?.ApproximateCreationDateTime || Date.now()),
            Source: statusToSource[data.status],
            Resources: [tableArn],
            DetailType: record['eventName'],
            Detail: JSON.stringify(data),
            EventBusName: eventBrigeBusName,
        }

        return event

}
