import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2'

export interface EdgeStackProps extends cdk.StackProps {
  vpc: ec2.IVpc
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

    this.publicAlb = new elbv2.ApplicationLoadBalancer(this, 'ReliaVuePublicAlb', {
      vpc: props.vpc,
      internetFacing: true,
      securityGroup: albSecurityGroup,
      loadBalancerName: 'reliavue-public-alb-dev',
      vpcSubnets: {
        subnetGroupName: 'public',
      },
    })

    this.publicAlb.addListener('HttpListener', {
      port: 80,
      open: true,
      defaultAction: elbv2.ListenerAction.fixedResponse(200, {
        contentType: 'text/plain',
        messageBody: 'ReliaVue edge HTTP listener ready',
      }),
    })

    new cdk.CfnOutput(this, 'PublicAlbDnsName', {
      value: this.publicAlb.loadBalancerDnsName,
    })

    new cdk.CfnOutput(this, 'PublicAlbArn', {
      value: this.publicAlb.loadBalancerArn,
    })
  }
}
