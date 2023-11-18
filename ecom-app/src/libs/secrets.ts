import {
    GetSecretValueCommand,
    GetSecretValueCommandInput,
    SecretsManagerClient,
  } from '@aws-sdk/client-secrets-manager';
  
  const client = new SecretsManagerClient({});
  
  const getSecret = async (secretId: string) => {
    const params: GetSecretValueCommandInput = {
      SecretId: secretId,
    };
  
    const command = new GetSecretValueCommand(params);
    const response = await client.send(command);
  
    return response.SecretString;
  };
  
  // alternative if you dont want to store the password at secret manager 
  // const getSecret = (secretId: string) => {
  // const result = {
  //   secretId1: 'hard-coded-password',
  //   secredId2: 'warehouseApiKey',
  // }[secretId]
  // return result
  // }

  const Secrets = {
    getSecret,
  };
  
  export default Secrets;