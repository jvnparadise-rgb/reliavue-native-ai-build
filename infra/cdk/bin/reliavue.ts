import * as cdk from 'aws-cdk-lib'
import { NetworkStack } from '../lib/stacks/network-stack'

const app = new cdk.App()

new NetworkStack(app, 'ReliaVue-Network-dev', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
})
