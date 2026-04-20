import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as ecs from 'aws-cdk-lib/aws-ecs'
import * as ecr from 'aws-cdk-lib/aws-ecr'
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2'
import * as logs from 'aws-cdk-lib/aws-logs'
import * as iam from 'aws-cdk-lib/aws-iam'

export interface ComputeStackProps extends cdk.StackProps {
  vpc: ec2.IVpc
}

export class ComputeStack extends cdk.Stack {
  public readonly cluster: ecs.Cluster
  public readonly apiService: ecs.FargateService
  public readonly workerTaskDefinition: ecs.FargateTaskDefinition
  public readonly apiLoadBalancer: elbv2.ApplicationLoadBalancer
  public readonly apiSecurityGroup: ec2.SecurityGroup

  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id, props)

    this.apiSecurityGroup = new ec2.SecurityGroup(this, 'ReliaVueApiSecurityGroup', {
      vpc: props.vpc,
      allowAllOutbound: true,
      description: 'Security group for ReliaVue API service',
    })

    const albSecurityGroup = new ec2.SecurityGroup(this, 'ReliaVueAlbSecurityGroup', {
      vpc: props.vpc,
      allowAllOutbound: true,
      description: 'Security group for ReliaVue internal ALB',
    })

    this.apiSecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(8000),
      'Allow ALB to reach API container'
    )

    this.cluster = new ecs.Cluster(this, 'ReliaVueCluster', {
      vpc: props.vpc,
      clusterName: 'reliavue-cluster-dev',
      containerInsightsV2: ecs.ContainerInsights.ENABLED,
    })

    const apiLogGroup = new logs.LogGroup(this, 'ReliaVueApiLogGroup', {
      logGroupName: '/reliavue/dev/api',
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    })

    const workerLogGroup = new logs.LogGroup(this, 'ReliaVueWorkerLogGroup', {
      logGroupName: '/reliavue/dev/worker',
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    })

    const executionRole = new iam.Role(this, 'ReliaVueTaskExecutionRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AmazonECSTaskExecutionRolePolicy'
        ),
      ],
    })

    const taskRole = new iam.Role(this, 'ReliaVueTaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    })

    const apiRepository = new ecr.Repository(this, 'ReliaVueApiRepository', {
      repositoryName: 'reliavue-api-dev',
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      emptyOnDelete: false,
    })

    const workerRepository = new ecr.Repository(this, 'ReliaVueWorkerRepository', {
      repositoryName: 'reliavue-worker-dev',
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      emptyOnDelete: false,
    })

    const apiTaskDefinition = new ecs.FargateTaskDefinition(this, 'ReliaVueApiTaskDefinition', {
      cpu: 512,
      memoryLimitMiB: 1024,
      executionRole,
      taskRole,
    })

    apiTaskDefinition.addContainer('ApiContainer', {
      image: ecs.ContainerImage.fromEcrRepository(apiRepository, 'latest'),
      containerName: 'reliavue-api',
      logging: ecs.LogDrivers.awsLogs({
        logGroup: apiLogGroup,
        streamPrefix: 'ecs',
      }),
      environment: {
        APP_NAME: 'ReliaVue API',
        ENVIRONMENT: 'dev',
      },
      portMappings: [
        {
          containerPort: 8000,
          protocol: ecs.Protocol.TCP,
        },
      ],
    })

    this.workerTaskDefinition = new ecs.FargateTaskDefinition(this, 'ReliaVueWorkerTaskDefinition', {
      cpu: 512,
      memoryLimitMiB: 1024,
      executionRole,
      taskRole,
    })

    this.workerTaskDefinition.addContainer('WorkerContainer', {
      image: ecs.ContainerImage.fromEcrRepository(workerRepository, 'latest'),
      containerName: 'reliavue-worker',
      logging: ecs.LogDrivers.awsLogs({
        logGroup: workerLogGroup,
        streamPrefix: 'ecs',
      }),
      environment: {
        ENVIRONMENT: 'dev',
      },
    })

    this.apiLoadBalancer = new elbv2.ApplicationLoadBalancer(this, 'ReliaVueInternalAlb', {
      vpc: props.vpc,
      internetFacing: false,
      securityGroup: albSecurityGroup,
      loadBalancerName: 'reliavue-internal-alb-dev',
      vpcSubnets: {
        subnetGroupName: 'app',
      },
    })

    const listener = this.apiLoadBalancer.addListener('HttpListener', {
      port: 80,
      open: false,
    })

    this.apiService = new ecs.FargateService(this, 'ReliaVueApiService', {
      cluster: this.cluster,
      taskDefinition: apiTaskDefinition,
      desiredCount: 1,
      minHealthyPercent: 100,
      maxHealthyPercent: 200,
      assignPublicIp: false,
      securityGroups: [this.apiSecurityGroup],
      vpcSubnets: {
        subnetGroupName: 'app',
      },
      serviceName: 'reliavue-api-service-dev',
      healthCheckGracePeriod: cdk.Duration.seconds(60),
    })

    listener.addTargets('ApiTargets', {
      port: 80,
      targets: [
        this.apiService.loadBalancerTarget({
          containerName: 'reliavue-api',
          containerPort: 8000,
        }),
      ],
      healthCheck: {
        path: '/health',
        healthyHttpCodes: '200',
      },
    })

    new ecs.FargateService(this, 'ReliaVueWorkerService', {
      cluster: this.cluster,
      taskDefinition: this.workerTaskDefinition,
      desiredCount: 1,
      minHealthyPercent: 100,
      maxHealthyPercent: 200,
      assignPublicIp: false,
      securityGroups: [this.apiSecurityGroup],
      vpcSubnets: {
        subnetGroupName: 'app',
      },
      serviceName: 'reliavue-worker-service-dev',
    })

    new cdk.CfnOutput(this, 'ClusterName', {
      value: this.cluster.clusterName,
    })

    new cdk.CfnOutput(this, 'ApiLoadBalancerDnsName', {
      value: this.apiLoadBalancer.loadBalancerDnsName,
    })

    new cdk.CfnOutput(this, 'ApiRepositoryUri', {
      value: apiRepository.repositoryUri,
    })

    new cdk.CfnOutput(this, 'WorkerRepositoryUri', {
      value: workerRepository.repositoryUri,
    })
  }
}
