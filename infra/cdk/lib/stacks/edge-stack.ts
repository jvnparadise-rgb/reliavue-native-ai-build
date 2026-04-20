import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as ecs from 'aws-cdk-lib/aws-ecs'
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2'

export interface EdgeStackProps extends cdk.StackProps {
  vpc: ec2.IVpc
  apiService: ecs.FargateService
  apiSecurityGroup: ec2.SecurityGroup
}

export class EdgeStack extends cdk.Stack {
  public readonly publicAlb: elbv2.ApplicationLoadBalancer

  constructor(scope: Construct, id: string, props: EdgeStackProps) {
    super(scope, id, props)

    const albSecurityGroup = new ec2.SecurityGroup(this, 'ReliaVuePublicAlbSecurityGroup', {
      vpc: props.vpc,
      allowAllOutbound: true,
      description: 'Security group for ReliaVue public ALB',
    })

    albSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'Allow HTTP ingress')
    albSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'Allow HTTPS ingress')

    props.apiSecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(8000),
      'Allow public ALB to reach API container'
    )

    this.publicAlb = new elbv2.ApplicationLoadBalancer(this, 'ReliaVuePublicAlb', {
      vpc: props.vpc,
      internetFacing: true,
      securityGroup: albSecurityGroup,
      loadBalancerName: 'reliavue-public-alb-dev',
      vpcSubnets: {
        subnetGroupName: 'public',
      },
    })

    const listener = this.publicAlb.addListener('HttpListener', {
      port: 80,
      open: true,
    })

    listener.addTargets('PublicApiTargets', {
      port: 80,
      targets: [
        props.apiService.loadBalancerTarget({
          containerName: 'reliavue-api',
          containerPort: 8000,
        }),
      ],
      healthCheck: {
        path: '/health',
        healthyHttpCodes: '200',
      },
    })

    new cdk.CfnOutput(this, 'PublicAlbDnsName', {
      value: this.publicAlb.loadBalancerDnsName,
    })

    new cdk.CfnOutput(this, 'PublicAlbArn', {
      value: this.publicAlb.loadBalancerArn,
    })
  }
}
