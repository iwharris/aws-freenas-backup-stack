import * as s3 from '@aws-cdk/aws-s3';
import * as iam from '@aws-cdk/aws-iam';
import { App, RemovalPolicy, Duration, Stack, StackProps, CfnOutput } from '@aws-cdk/core';

export class AwsFreenasBackupStack extends Stack {
    constructor(scope: App, id: string, props?: StackProps) {
        super(scope, id, props);

        const bucketName = this.node.tryGetContext('bucket_name');

        const bucket = new s3.Bucket(this, 'FreenasS3BackupBucket', {
            bucketName,
            // KMS_MANAGED is preferable but won't work when backing up small files
            // See https://github.com/rclone/rclone/issues/1824 for details
            encryption: s3.BucketEncryption.S3_MANAGED,
            publicReadAccess: false,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            lifecycleRules: [
                {
                    transitions: [
                        {
                            transitionAfter: Duration.days(1),
                            storageClass: s3.StorageClass.INTELLIGENT_TIERING,
                        },
                    ],
                },
            ],
            removalPolicy: RemovalPolicy.RETAIN,
        });

        const group = new iam.Group(this, 'FreenasS3BackupGroup', {
            groupName: 'FreenasS3BackupGroup',
        });

        const user = new iam.User(this, 'FreenasBackupUser', {
            groups: [group],
        });

        // Customer managed policy links the user to the S3 access permission
        // Minimal permissions taken from https://rclone.org/s3/
        new iam.ManagedPolicy(this, 'FreenasS3BackupManagedPolicy', {
            managedPolicyName: 'FreenasS3BackupManagedPolicy',
            groups: [group],
            statements: [
                // Allow enumerating all buckets in account
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: ['s3:ListAllMyBuckets'],
                    resources: ['arn:aws:s3:::*'],
                }),

                // Allow some bucket-level actions
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: ['s3:ListBucket'],
                    resources: [bucket.bucketArn],
                }),

                // Allow object-level get/put/delete
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: ['s3:GetObject', 's3:PutObject', 's3:PutObjectAcl', 's3:DeleteObject'],
                    resources: [`${bucket.bucketArn}/*`],
                }),
            ],
        });

        const accessKey = new iam.CfnAccessKey(this, 'FreenasBackupUserAccessKey', {
            userName: user.userName,
        });

        new CfnOutput(this, 'accessKeyId', {
            value: accessKey.ref,
            description: 'Access key ID for the backup user',
        });
        new CfnOutput(this, 'secretAccessKey', {
            value: accessKey.attrSecretAccessKey,
            description: 'Secret access key for the backup user',
        });
    }
}
