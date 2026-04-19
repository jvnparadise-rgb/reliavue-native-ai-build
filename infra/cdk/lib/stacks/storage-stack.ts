import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'
import * as s3 from 'aws-cdk-lib/aws-s3'

export class StorageStack extends cdk.Stack {
  public readonly rawRgbBucket: s3.Bucket
  public readonly rawThermalBucket: s3.Bucket
  public readonly orthomosaicBucket: s3.Bucket
  public readonly meshBucket: s3.Bucket
  public readonly annotationBucket: s3.Bucket
  public readonly reportBucket: s3.Bucket
  public readonly modelArtifactBucket: s3.Bucket
  public readonly frontendArtifactBucket: s3.Bucket

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    this.rawRgbBucket = this.createBucket('RawRgbBucket', 'raw-rgb', true)
    this.rawThermalBucket = this.createBucket('RawThermalBucket', 'raw-thermal', true)
    this.orthomosaicBucket = this.createBucket('OrthomosaicBucket', 'orthomosaics', true)
    this.meshBucket = this.createBucket('MeshBucket', 'meshes', true)
    this.annotationBucket = this.createBucket('AnnotationBucket', 'annotations', true)
    this.reportBucket = this.createBucket('ReportBucket', 'reports', true)
    this.modelArtifactBucket = this.createBucket('ModelArtifactBucket', 'model-artifacts', true)
    this.frontendArtifactBucket = this.createBucket('FrontendArtifactBucket', 'frontend-artifacts', false)

    new cdk.CfnOutput(this, 'RawRgbBucketName', {
      value: this.rawRgbBucket.bucketName,
    })

    new cdk.CfnOutput(this, 'RawThermalBucketName', {
      value: this.rawThermalBucket.bucketName,
    })

    new cdk.CfnOutput(this, 'OrthomosaicBucketName', {
      value: this.orthomosaicBucket.bucketName,
    })

    new cdk.CfnOutput(this, 'MeshBucketName', {
      value: this.meshBucket.bucketName,
    })
  }

  private createBucket(id: string, suffix: string, versioned: boolean): s3.Bucket {
    return new s3.Bucket(this, id, {
      bucketName: `${this.account}-${this.region}-reliavue-${suffix}`.toLowerCase(),
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: false,
    })
  }
}
