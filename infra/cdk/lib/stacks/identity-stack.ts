import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'
import * as cognito from 'aws-cdk-lib/aws-cognito'

export class IdentityStack extends cdk.Stack {
  public readonly userPool: cognito.UserPool
  public readonly userPoolClient: cognito.UserPoolClient

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    this.userPool = new cognito.UserPool(this, 'ReliaVueUserPool', {
      userPoolName: 'reliavue-users-dev',
      selfSignUpEnabled: false,
      signInAliases: {
        email: true,
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
        fullname: {
          required: false,
          mutable: true,
        },
      },
      passwordPolicy: {
        minLength: 12,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    })

    this.userPoolClient = new cognito.UserPoolClient(this, 'ReliaVueUserPoolClient', {
      userPool: this.userPool,
      userPoolClientName: 'reliavue-web-client-dev',
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
      preventUserExistenceErrors: true,
      generateSecret: false,
    })

    this.userPool.addDomain('ReliaVueCognitoDomain', {
      cognitoDomain: {
        domainPrefix: `reliavue-dev-${this.account}`.toLowerCase(),
      },
    })

    new cognito.CfnUserPoolGroup(this, 'AdminGroup', {
      userPoolId: this.userPool.userPoolId,
      groupName: 'admin',
      description: 'ReliaVue administrators',
      precedence: 1,
    })

    new cognito.CfnUserPoolGroup(this, 'ExecutiveGroup', {
      userPoolId: this.userPool.userPoolId,
      groupName: 'executive',
      description: 'ReliaVue executive users',
      precedence: 2,
    })

    new cognito.CfnUserPoolGroup(this, 'TechnicianGroup', {
      userPoolId: this.userPool.userPoolId,
      groupName: 'technician',
      description: 'ReliaVue technician users',
      precedence: 3,
    })

    new cognito.CfnUserPoolGroup(this, 'CustomerGroup', {
      userPoolId: this.userPool.userPoolId,
      groupName: 'customer',
      description: 'ReliaVue customer users',
      precedence: 4,
    })

    new cdk.CfnOutput(this, 'UserPoolId', {
      value: this.userPool.userPoolId,
    })

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: this.userPoolClient.userPoolClientId,
    })
  }
}
