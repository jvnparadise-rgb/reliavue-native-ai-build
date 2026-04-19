import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch'
import * as sns from 'aws-cdk-lib/aws-sns'

export class ObservabilityStack extends cdk.Stack {
  public readonly alarmTopic: sns.Topic
  public readonly dashboard: cloudwatch.Dashboard

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    this.alarmTopic = new sns.Topic(this, 'ReliaVueAlarmTopic', {
      topicName: 'reliavue-alarms-dev',
      displayName: 'ReliaVue Alarms Dev',
    })

    this.dashboard = new cloudwatch.Dashboard(this, 'ReliaVueDashboard', {
      dashboardName: 'reliavue-dev-overview',
    })

    const apiCpuMetric = new cloudwatch.Metric({
      namespace: 'AWS/ECS',
      metricName: 'CPUUtilization',
      statistic: 'Average',
      period: cdk.Duration.minutes(5),
      dimensionsMap: {
        ClusterName: 'reliavue-cluster-dev',
        ServiceName: 'reliavue-api-service-dev',
      },
    })

    const alb5xxMetric = new cloudwatch.Metric({
      namespace: 'AWS/ApplicationELB',
      metricName: 'HTTPCode_ELB_5XX_Count',
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
      dimensionsMap: {
        LoadBalancer: 'placeholder-load-balancer-dimension',
      },
    })

    new cloudwatch.Alarm(this, 'ReliaVueApiCpuAlarm', {
      metric: apiCpuMetric,
      threshold: 80,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      alarmDescription: 'ReliaVue API CPU high alarm',
    })

    new cloudwatch.Alarm(this, 'ReliaVueAlb5xxAlarm', {
      metric: alb5xxMetric,
      threshold: 5,
      evaluationPeriods: 1,
      datapointsToAlarm: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      alarmDescription: 'ReliaVue ALB 5XX alarm placeholder',
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    })

    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'ReliaVue API CPU',
        left: [apiCpuMetric],
        width: 12,
      }),
      new cloudwatch.GraphWidget({
        title: 'ReliaVue ALB 5XX',
        left: [alb5xxMetric],
        width: 12,
      })
    )

    new cdk.CfnOutput(this, 'AlarmTopicArn', {
      value: this.alarmTopic.topicArn,
    })

    new cdk.CfnOutput(this, 'DashboardName', {
      value: this.dashboard.dashboardName,
    })
  }
}
