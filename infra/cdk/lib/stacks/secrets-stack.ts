import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'
import * as kms from 'aws-cdk-lib/aws-kms'
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager'
import * as ssm from 'aws-cdk-lib/aws-ssm'

export class SecretsStack extends cdk.Stack {
  public readonly secretsKey: kms.Key
  public readonly appConfigSecret: secretsmanager.Secret

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    this.secretsKey = new kms.Key(this, 'ReliaVueSecretsKey', {
      alias: 'alias/reliavue-secrets',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    })

    this.appConfigSecret = new secretsmanager.Secret(this, 'ReliaVueAppConfigSecret', {
      secretName: 'reliavue/app/config',
      encryptionKey: this.secretsKey,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          appName: 'ReliaVue',
          environment: 'dev',
          logLevel: 'INFO',
        }),
        generateStringKey: 'placeholderApiKey',
        excludePunctuation: true,
      },
    })

    new ssm.StringParameter(this, 'ReliaVueEnvironmentName', {
      parameterName: '/reliavue/dev/environment',
      stringValue: 'dev',
      description: 'ReliaVue environment name',
    })

    new ssm.StringParameter(this, 'ReliaVueApplicationName', {
      parameterName: '/reliavue/application/name',
      stringValue: 'ReliaVue',
      description: 'ReliaVue application name',
    })

    new cdk.CfnOutput(this, 'AppConfigSecretArn', {
      value: this.appConfigSecret.secretArn,
    })

    new cdk.CfnOutput(this, 'SecretsKeyArn', {
      value: this.secretsKey.keyArn,
    })
  }
}
