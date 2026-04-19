import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as rds from 'aws-cdk-lib/aws-rds'

export interface DataStackProps extends cdk.StackProps {
  vpc: ec2.IVpc
}

export class DataStack extends cdk.Stack {
  public readonly database: rds.DatabaseInstance
  public readonly dbSecurityGroup: ec2.SecurityGroup

  constructor(scope: Construct, id: string, props: DataStackProps) {
    super(scope, id, props)

    this.dbSecurityGroup = new ec2.SecurityGroup(this, 'ReliaVueDbSecurityGroup', {
      vpc: props.vpc,
      allowAllOutbound: false,
      description: 'Security group for ReliaVue PostgreSQL database',
    })

    const subnetGroup = new rds.SubnetGroup(this, 'ReliaVueDbSubnetGroup', {
      description: 'Private isolated subnets for ReliaVue database',
      vpc: props.vpc,
      vpcSubnets: {
        subnetGroupName: 'data',
      },
    })

    this.database = new rds.DatabaseInstance(this, 'ReliaVuePostgres', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_16_4,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.BURSTABLE4_GRAVITON,
        ec2.InstanceSize.MICRO
      ),
      vpc: props.vpc,
      vpcSubnets: {
        subnetGroupName: 'data',
      },
      subnetGroup,
      credentials: rds.Credentials.fromGeneratedSecret('reliavue_admin'),
      databaseName: 'reliavue',
      allocatedStorage: 20,
      maxAllocatedStorage: 100,
      multiAz: false,
      publiclyAccessible: false,
      securityGroups: [this.dbSecurityGroup],
      backupRetention: cdk.Duration.days(7),
      deletionProtection: false,
      deleteAutomatedBackups: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // dev default, tighten for stage/prod
    })

    new cdk.CfnOutput(this, 'DatabaseSecretArn', {
      value: this.database.secret?.secretArn ?? 'missing-secret-arn',
    })

    new cdk.CfnOutput(this, 'DatabaseEndpointAddress', {
      value: this.database.instanceEndpoint.hostname,
    })
  }
}
