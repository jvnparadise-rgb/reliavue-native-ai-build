import * as cdk from 'aws-cdk-lib'
import { NetworkStack } from '../lib/stacks/network-stack'
import { DataStack } from '../lib/stacks/data-stack'
import { StorageStack } from '../lib/stacks/storage-stack'

const app = new cdk.App()

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
}

const networkStack = new NetworkStack(app, 'ReliaVue-Network-dev', {
  env,
})

new DataStack(app, 'ReliaVue-Data-dev', {
  env,
  vpc: networkStack.vpc,
})

new StorageStack(app, 'ReliaVue-Storage-dev', {
  env,
})
