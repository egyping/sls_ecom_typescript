# sls_ecom_typescript

<< 01_blankTemplate >>
Create new git repo and clone it locally 
Now run the sis to create new sls project from the template of https://github.com/SamWSoftware/interviewAPI
sls create --template-url https://github.com/SamWSoftware/interviewAPI --path ecom-ap
adjust the dynamo tables to have two tables product and orders, orders table has stream
adjust the environment variables and remove unecessary things like assetbucket 
npm install 
01_blankTemplate has the starter after adjusting and removing the unecessary things (kickoff template )

<< 02_getProducts_API >>
change the region: 'us-east-1', as it was frankfurt

A sample of product 
{
    "id": "e132ee4f-acad—4553-871f-6abf8c4d26a6",
    "pk": "clothing",
    "sk": "mens#jackets#e132ee4f—acad—4553-871f-6abf8c4d26a6",
    "title": "Firewall Rain Jacket",
    "brand": "RAB",
    "description": "Lightweight rain jacket made for intrepid
    "colour": "red",
    "sizesAvailable": [
    { "sizeCode": 1, "displayValue": "small" },
    { "sizeCode": 2, "displayValue": "medium" },
    { "sizeCode": 3, "displayValue": "large" }
    ]
}
worked on the getProducts and types\dynamo
adjusted some settings at serverless.ts
sls deploy
sls deploy function -f getProducts
to deploy specific function 

test
https://m5o8u4ek01.execute-api.eu-central-1.amazonaws.com/dev/products
https://m5o8u4ek01.execute-api.eu-central-1.amazonaws.com/dev/products?fake=anything
400
{
    "message": "missing group string parameters"
}

test 
https://m5o8u4ek01.execute-api.eu-central-1.amazonaws.com/dev/products?group=clothing
200
[]

bulk upload data to dynamo table 

npx ts-node myScript.ts
npm install -g ts-node
ts-node seedData/writeSeedToFile.ts
https://5uf0knr5g9.execute-api.us-east-1.amazonaws.com/dev/products?group=climbing

generate fake items data and upload it to dynamodb 
geenrating the data i will use the products.json directly as fake data generation always easy with chatgpt
so started from 
deploySeedToAWS


environment=dev ts-node ./seedData/deploySeedToAWS.ts 
this will execute the generate data and export the data to aws tables 

** Get Product **
create new function at src and serverless 
sls deploy
test
https://5uf0knr5g9.execute-api.us-east-1.amazonaws.com/dev/product/7910750b-926c-4a5f-86c8-9cb32a92db4c



<< 03_createOrder >>
First create model (interface) for the order at the types then create the function which will form the order 
at serverless>functions create record for the createOrder function 
the variable authorizer represent cognito so any function has http (api gateway) and has authorizer variable 
means it secured by cognito and cognito data is passing 
authorizer connected to cognitoResources where the cloudformation of cognito is defined over there 
serverless.ts > has resources section > the section has CognitoResources > which point to cognitoResources
sls deploy
https://5uf0knr5g9.execute-api.us-east-1.amazonaws.com/dev/orders
post test
its secured request need cognito token so how to create token?
you can do it through aws cli 
you can do it through https://getmycognitotoken.com
its sign up procss and fully handle by frontend and cognito nothing to do with the serverless backend
get the token and use bearer token 
you need to pass the followings in the post body  "" items: { id: ProductId; count: number; size?: number }[]; ""
raw - 
{
    "items": [
        {
        "id": "0ecc7acf-6bd6-479d-8645-0eb828901d98",
        "count": 2,
        "size": 60
        }
    ]
}


<< 04_streamHandler >>
now we can place orders 
we want that whenever new order get placed anoth lambda function to be executed 
this will happen through Dynamodb Streams enable trigger >> send to event bridge > EB trigger lambda function
streamHandler: lambda will be executed\triggered by dynamodbstream when new order get placed 
npm i -S @aws-sdk/client-eventbridge
to install the unmarshall 
npm i -S @aws-sdk/util-dynamodb 
you will need to eventBrigeBusName to the environments and cusotm 
this applied to the development D this needed for using iam roles attached to the stream function
allow the function to put event to the event bus
npm i -D serverless-iam-roles-per-function 
and serverless-iam-roles-per-function to the plugins list
by deploying you will get a new trigger at the order table in the console
now create new order and check 

>> new function ebOrderPlacedNotification this will email the user by new order placed 
the function listen to the event bridge new order and trigger ses to send email.
we will use the SES client so we need to create client at libs and install ses sdk
npm i -S @aws-sdk/client-ses




