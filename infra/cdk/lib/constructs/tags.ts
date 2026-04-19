import { Tags } from 'aws-cdk-lib'
import { Construct } from 'constructs'

export function applyBaseTags(scope: Construct): void {
  Tags.of(scope).add('Application', 'ReliaVue')
  Tags.of(scope).add('ManagedBy', 'CDK')
}
